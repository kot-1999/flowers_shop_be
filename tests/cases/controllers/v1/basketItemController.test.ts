import { faker } from '@faker-js/faker'
import { User } from '@prisma/client'
import { expect } from 'chai'
import dayjs from 'dayjs'
import supertest from 'supertest'

import app from '../../../../src/app'
import { BasketController } from '../../../../src/controllers/v1/BasketController'
import { EncryptionService } from '../../../../src/services/Encryption'
import prisma from '../../../../src/services/Prisma'
import BasketItemGenerator from '../../../utils/generators/BasketItemGenerator'
import UserGenerator from '../../../utils/generators/UserGenerator'
import { loginUserAndGetCookie } from '../../../utils/helpers'

const endpoint = (val: string = '') => `/api/v1/basket-items/${val}`
const publicEndpoint = '/api/v1/public/basket-items/'

const password = 'Test123'

describe(`GET ${publicEndpoint}`, () => {

    it('Should return basket items (200)', async () => {
        const goods = await prisma.good.findMany({
            where: { deletedAt: null },
            take: 4,
            select: {
                id: true,
                pricings: {
                    select: {
                        pricing: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        })
        
        const res = await supertest(app)
            .get(publicEndpoint)
            .send({
                basketItems: goods.map((good: any) => ({
                    goodID: good.id,
                    pricingID: good.pricings[0].pricing.id,
                    quantity: faker.number.int({
                        min: 1,
                        max: 100 
                    }),
                    createdAt: dayjs().toISOString()
                }))
            })
        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BasketController.schemas.response.getBasketItems.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    // it('Should return empty array when user has no basket items (200)', async () => {
    //
    //     const emptyUser = await UserGenerator.generateUser({
    //         password: EncryptionService.hashSHA256(password)
    //     })
    //
    //     const emptyUserCookie = await loginUserAndGetCookie({
    //         email: emptyUser.email,
    //         password
    //     })
    //
    //     const res = await supertest(app)
    //         .get(endpoint())
    //
    //     expect(res.statusCode).to.equal(200)
    //     expect(res.type).to.eq('application/json')
    //
    //     const validationResult = BasketController.schemas.response.getBasketItems.validate(res.body)
    //
    //     expect(validationResult.error).to.eq(undefined)
    //     expect(res.body.basketItems).to.be.an('array')
    // })
})

describe(`GET ${endpoint()}`, () => {
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

    it('Should return basket items (200)', async () => {
        const res = await supertest(app)
            .get(endpoint())
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BasketController.schemas.response.getBasketItems.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('Should return empty array when user has no basket items (200)', async () => {

        const emptyUser = await UserGenerator.generateUser({
            password: EncryptionService.hashSHA256(password)
        })

        const emptyUserCookie = await loginUserAndGetCookie({
            email: emptyUser.email,
            password
        })

        const res = await supertest(app)
            .get(endpoint())
            .set('Cookie', emptyUserCookie)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BasketController.schemas.response.getBasketItems.validate(res.body)

        expect(validationResult.error).to.eq(undefined)
        expect(res.body.basketItems).to.be.an('array')
    })

    it('Should return unauthorized (401)', async () => {
        const res = await supertest(app)
            .get(endpoint())

        expect(res.statusCode).to.equal(401)
    })
})

describe(`POST ${endpoint()}`, () => {
    let sessionCookie: string
    let user: User
    before(async () => {
        user = await prisma.user.findFirstOrThrow({
            where: { deletedAt: null }
        })

        sessionCookie = await loginUserAndGetCookie({
            email: user.email,
            password
        })
    })

    it('Should create basket item (200)', async () => {
        const good = await prisma.good.findFirstOrThrow({
            where: { deletedAt: null },

            select: {
                id: true,
                pricings: {
                    select: {
                        pricing: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        })

        const res = await supertest(app)
            .post(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                goodID: good.id,
                pricingID: good.pricings[0].pricing.id,
                quantity: 3
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BasketController.schemas.response.postBasketItem.validate(res.body)

        expect(validationResult.error).to.eq(undefined)

    })

    it('Should cap quantity to available stock', async () => {

        const good = await prisma.good.findFirstOrThrow({
            where: { deletedAt: null },

            select: {
                id: true,
                pricings: {
                    select: {
                        pricing: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        })

        await prisma.pricing.update({
            where: { id: good.pricings[0].pricing.id },
            data: { quantity: 5 }
        })

        const res = await supertest(app)
            .post(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                goodID: good.id,
                pricingID: good.pricings[0].pricing.id,
                quantity: 100

            })
        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BasketController.schemas.response.postBasketItem.validate(res.body)

        expect(validationResult.error).to.eq(undefined)

        const basketItem = await prisma.basketItem.findFirstOrThrow({
            where: {
                userID: user.id,
                pricingID: good.pricings[0].pricing.id
            }
        })

        expect(basketItem.quantity).to.equal(5)
    })
})

describe(`PATCH ${endpoint(':basketItemID')}`, () => {
    let sessionCookie: string
    let user: User

    before(async () => {
        user = await prisma.user.findFirstOrThrow()

        sessionCookie = await loginUserAndGetCookie({
            email: user.email,
            password
        })
    })

    it('Should update quantity (200)', async () => {
        const basketItem = await BasketItemGenerator.generateBasketItem({
            userID: user.id,
            quantity: 1
        })

        const res = await supertest(app)
            .patch(endpoint(basketItem.id))
            .set('Cookie', sessionCookie)
            .send({
                quantity: 4
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BasketController.schemas.response.patchBasketItem.validate(res.body)

        expect(validationResult.error).to.eq(undefined)

    })

    it('Should cap updated quantity to available stock', async () => {
        const user = await prisma.user.findFirstOrThrow()

        const basketItem = await BasketItemGenerator.generateBasketItem({
            userID: user.id
        })

        await prisma.pricing.update({
            where: { id: basketItem.pricingID },
            data: { quantity: 2 }
        })

        const res = await supertest(app)
            .patch(endpoint(basketItem.id))
            .set('Cookie', sessionCookie)
            .send({
                quantity: 50
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = BasketController.schemas.response.patchBasketItem.validate(res.body)

        expect(validationResult.error).to.eq(undefined)

        const updated = await prisma.basketItem.findUniqueOrThrow({
            where: { id: basketItem.id }
        })

        expect(updated.quantity).to.equal(2)
    })

    it('Should return 404 for missing basket item', async () => {
        const res = await supertest(app)
            .patch(endpoint(faker.string.uuid()))
            .set('Cookie', sessionCookie)
            .send({
                quantity: 1
            })

        expect(res.statusCode).to.equal(404)
    })
})

describe(`DELETE ${endpoint(':basketItemID')}`, () => {
    let sessionCookie: string
    let user: User

    before(async () => {
        user = await prisma.user.findFirstOrThrow()

        sessionCookie = await loginUserAndGetCookie({
            email: user.email,
            password
        })
    })

    it('Should delete basket item (200)', async () => {
        const basketItem = await BasketItemGenerator.generateBasketItem({
            userID: user.id
        })

        const res = await supertest(app)
            .delete(endpoint(basketItem.id))
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(200)

        const deleted = await prisma.basketItem.findUnique({
            where: { id: basketItem.id }
        })

        expect(deleted).to.equal(null)
    })

    it('Should return 404 for missing basket item', async () => {
        const res = await supertest(app)
            .delete(endpoint(faker.string.uuid()))
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(404)
    })
})