import { faker } from '@faker-js/faker'
import { Country } from '@prisma/client'
import { expect } from 'chai'
import supertest from 'supertest'

import app from '../../../../src/app'
import { AddressController } from '../../../../src/controllers/v1/AddressController'
import prisma from '../../../../src/services/Prisma'
import { loginUserAndGetCookie } from '../../../utils/helpers'

const endpoint = (val = '') => '/api/v1/addresses/' + val

const password = 'Test123'

describe(`GET ${endpoint()}`, () => {
    let sessionCookie: string
    let user: any

    before(async () => {
        const address = await prisma.address.findFirst({
            where: {
                deletedAt: null
            },
            select: {
                userID: true
            }
        })

        user = await prisma.user.findFirst({
            where: {
                id: address.userID,
                deletedAt: null
            }
        })

        sessionCookie = await loginUserAndGetCookie({
            email: user.email,
            password
        })
    })

    it('Should return user addresses (200)', async () => {
        const res = await supertest(app)
            .get(endpoint())
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validation= AddressController.schemas.response.getAddresses.validate(res.body)

        expect(validation.error).to.eq(undefined)
    })
})

describe(`PUT ${endpoint()}`, () => {
    let sessionCookie: string
    let user: any

    before(async () => {
        user = await prisma.user.findFirst({
            where: {
                deletedAt: null
            }
        })

        sessionCookie = await loginUserAndGetCookie({
            email: user.email,
            password
        })
    })

    it('Should create address (200)', async () => {
        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                building: faker.location.buildingNumber(),
                street: faker.location.street(),
                city: faker.location.city(),
                postcode: faker.location.zipCode(),
                country: Country.Taiwan,
                isDefault: false
            })

        expect(res.statusCode).to.eq(200)

        const validation
            = AddressController.schemas.response.putAddress.validate(res.body)

        expect(validation.error).to.eq(undefined)
    })

    it('Should update address (200)', async () => {
        const address = await prisma.address.findFirst({
            where: {
                userID: user.id,
                deletedAt: null 
            }
        })

        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                addressID: address.id,
                building: address.building,
                street: address.street,
                postcode: address.postcode,
                country: address.country,
                isDefault: true
            })

        expect(res.statusCode).to.eq(200)

        const updated = await prisma.address.findFirst({
            where: { id: address.id }
        })

        expect(updated?.isDefault).to.eq(true)
    })

    it('Should return 404 for invalid addressID', async () => {
        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                addressID: faker.string.uuid(),
                building: 'A',
                street: 'B',
                city: 'C',
                postcode: 'D',
                country: Country.Denmark,
                isDefault: false
            })

        expect(res.statusCode).to.eq(404)
    })

    it('Should enforce max 10 addresses (soft delete oldest non-default)', async () => {
        const countBefore = await prisma.address.count({
            where: {
                userID: user.id,
                deletedAt: null 
            }
        })

        const needed = Math.max(0, 11 - countBefore)

        for (let i = 0; i < needed; i++) {
            await prisma.address.create({
                data: {
                    userID: user.id,
                    building: '1',
                    street: 'Test',
                    city: 'Test',
                    postcode: '000',
                    country: Country.Finland,
                    isDefault: false
                }
            })
        }

        const oldestBefore = await prisma.address.findFirst({
            where: {
                userID: user.id,
                deletedAt: null,
                isDefault: false 
            },
            orderBy: { updatedAt: 'asc' }
        })

        await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                building: 'Overflow',
                street: 'Street',
                city: 'City',
                postcode: '000',
                country: Country.Iceland,
                isDefault: false
            })

        const deletedOld = await prisma.address.findFirst({
            where: { id: oldestBefore.id }
        })

        expect(deletedOld?.deletedAt).to.not.eq(null)
    })
})

describe(`DELETE ${endpoint(':addressID')}`, () => {
    let sessionCookie: string
    let user: any

    before(async () => {
        user = await prisma.user.findFirst({
            where: {
                deletedAt: null
            }
        })

        sessionCookie = await loginUserAndGetCookie({
            email: user.email,
            password
        })
    })

    it('Should delete address (200)', async () => {
        const address = await prisma.address.findFirst({
            where: {
                userID: user.id,
                deletedAt: null 
            }
        })

        const res = await supertest(app)
            .delete(endpoint(address.id))
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.eq(200)

        const deleted = await prisma.address.findFirst({
            where: { id: address.id }
        })

        expect(deleted?.deletedAt).to.not.eq(null)
    })

    it('Should return 404 for missing address', async () => {
        const res = await supertest(app)
            .delete(endpoint(faker.string.uuid()))
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.eq(404)
    })
})