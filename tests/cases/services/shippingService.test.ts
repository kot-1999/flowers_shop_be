import { Country } from '@prisma/client'
import { expect } from 'chai'
import dayjs from 'dayjs'

import prisma from '../../../src/services/Prisma'
import shippingService from '../../../src/services/ShippingService'
import { ShippingCountry } from '../../../src/utils/enums'

describe('Shipping label creation', () => {
    let shippingRateID: string

    it('Should create shipment and return rates', async () => {
        const users = await prisma.user.findMany({
            include: {
                basketItems: true
            }
        })

        const user = users.filter((u: any) => u.basketItems.length > 3)[0]
        const address = {
            building: '12',
            street: 'Hutnicka',
            city: 'Kosice',
            postcode: '04001',
            country: 'Slovakia',
            userID: user.id,
            apartment: null,
            isDefault: false,
            createdAt: dayjs().toISOString(),
            updatedAt: dayjs().toISOString(),
            deletedAt: null,
            user: user
        } as any

        const basketItems = await prisma.basketItem.findMany({
            where: {
                userID: address.userID
            },
            include: {
                pricing: {
                    include: {
                        itemType: true,
                        good: {
                            include: {
                                name: true,
                                selectionist: true
                            }
                        }
                    }
                }
            }
        })

        expect(basketItems).to.not.be.empty

        const shipment = await shippingService.createShipment(
            address,
            basketItems
        )

        expect(shipment.rates).to.not.be.empty
        shippingRateID = shipment.rates[0].objectId
    })

    it('Should create shipping label', async () => {
        const transaction = await shippingService.createLabel(shippingRateID)

        expect(transaction.objectState).to.equal('VALID')
        expect(transaction.labelUrl).to.be.a('string')

    })
})

// describe('Shipping - Rates per country', () => {
//     let user: any
//     let basketItems: any[]
//     const countries = Object.entries(ShippingCountry);
//
//     before(async () => {
//         const users = await prisma.user.findMany({
//             include: {
//                 basketItems: true
//             }
//         })
//
//         user = users.find((u: any) => u.basketItems.length > 3)
//
//         if (!user) {
//             throw new Error('No user found with > 3 basket items')
//         }
//
//         basketItems = await prisma.basketItem.findMany({
//             where: {
//                 userID: user.id
//             },
//             include: {
//                 pricing: {
//                     include: {
//                         itemType: true,
//                         good: {
//                             include: {
//                                 name: true,
//                                 selectionist: true
//                             }
//                         }
//                     }
//                 }
//             }
//         })
//     })
//
//     for (const [countryKey] of countries) {
//         it(`Should return rates and optionally create label for ${countryKey}`, async () => {
//             const address = {
//                 building: '12',
//                 street: 'Hutnicka',
//                 city: 'Test City',
//                 postcode: '04001',
//                 country: countryKey as Country,
//                 userID: user.id,
//                 apartment: null,
//                 isDefault: false,
//                 createdAt: dayjs().toISOString(),
//                 updatedAt: dayjs().toISOString(),
//                 deletedAt: null,
//                 user
//             } as any
//
//             const shipment = await shippingService.createShipment(
//                 address,
//                 basketItems
//             )
//
//             const rates = shipment.rates ?? []
//
//             // allow missing rates
//             if (!rates.length) {
//                 expect(rates.length).to.equal(0)
//                 return
//             }
//
//             expect(rates.length).to.be.greaterThan(0)
//
//             const rate = rates[0]
//
//             try {
//                 const transaction = await shippingService.createLabel(rate.objectId)
//
//                 const isCarrierError
//                     = transaction.status === 'ERROR'
//                     && transaction.messages?.some((m: any) => m.code === 'carrier_request_failed')
//
//                 if (!isCarrierError && transaction.status === 'ERROR') {
//                     console.log(
//                         `Unexpected label error for ${countryKey}`,
//                         transaction
//                     )
//                 }
//
//                 expect([
//                     'SUCCESS',
//                     'ERROR'
//                 ]).to.include(transaction.status)
//
//             } catch (err) {
//                 console.log(`Label failed for ${countryKey}`, err)
//             }
//         })
//     }
// })