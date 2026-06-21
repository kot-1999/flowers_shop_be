import { faker } from '@faker-js/faker'
import { UserRole } from '@prisma/client'
import { expect } from 'chai'
import supertest from 'supertest'

import app from '../../../../src/app'
import { UsersController } from '../../../../src/controllers/v1/UserController'
import prisma from '../../../../src/services/Prisma'
import { loginUserAndGetCookie } from '../../../utils/helpers'

const endpoint = (val: string = '') => '/api/v1/users/' + val

const adminEndpoint = (val: string = '') => '/api/v1/admin/users/' + val

const password = 'Test123'

describe('GET ' + endpoint(':userID'), () => {
    let userID: string
    let sessionCookie: string

    before(async () => {
        const user = await prisma.user.findFirst({ where: { role: UserRole.User } })
        userID = user.id
        sessionCookie = await loginUserAndGetCookie({
            email: user.email,
            password: password
        })
    })

    it('Wrong session - no cookie (401)', async () => {
        const res = await supertest(app)
            .get(endpoint(userID))
            .set('Content-Type', 'application/json')
        // No cookie sent

        expect(res.statusCode).to.equal(401)
    })

    it('Should return himself (200)', async () => {
        const res = await supertest(app)
            .get(endpoint(userID))
            .set('Content-Type', 'application/json')
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = UsersController.schemas.response.getUser.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('Should return another user (200)', async () => {
        const anotherUser = await prisma.user.findFirst({
            where: {
                id: {
                    not: userID
                },
                role: UserRole.User
            }
        })
        const anotherUserCookie = await loginUserAndGetCookie({
            email: anotherUser.email,
            password: password
        })

        const res = await supertest(app)
            .get(endpoint(userID))
            .set('Content-Type', 'application/json')
            .set('Cookie', anotherUserCookie)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = UsersController.schemas.response.getUser.validate(res.body)
        expect(validationResult.error).to.eq(undefined)
    })

    it('Should not find user (404)', async () => {
        const res = await supertest(app)
            .get(endpoint(faker.string.uuid()))
            .set('Content-Type', 'application/json')
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(404)
        expect(res.type).to.eq('application/json')
    })
})

describe('GET ' + adminEndpoint(), () => {
    let sessionCookie: string

    before(async () => {
        const user = await prisma.user.findFirst({
            where: {
                role: UserRole.Admin,
                deletedAt: null 
            }
        })

        sessionCookie = await loginUserAndGetCookie({
            email: user.email,
            password
        })
    })

    it('Should require auth (401)', async () => {
        const res = await supertest(app)
            .get(adminEndpoint())
            .query({
                page: 1,
                limit: 10
            })

        expect(res.statusCode).to.eq(401)
    })

    it('Should return users list (200)', async () => {
        const res = await supertest(app)
            .get(adminEndpoint())
            .set('Cookie', sessionCookie)
            .query({
                page: 1,
                limit: 10
            })

        expect(res.statusCode).to.eq(200)
        expect(res.type).to.eq('application/json')

        const validation = UsersController.schemas.response.getUsers.validate(res.body)
        expect(validation.error).to.eq(undefined)

        expect(Array.isArray(res.body.users)).to.eq(true)
    })

    it('Should apply pagination', async () => {
        const res = await supertest(app)
            .get(adminEndpoint())
            .set('Cookie', sessionCookie)
            .query({
                page: 1,
                limit: 2
            })

        expect(res.statusCode).to.eq(200)

        expect(res.body.users.length).to.be.lte(2)
        expect(res.body.paginationRes.page).to.eq(1)
        expect(res.body.paginationRes.limit).to.eq(2)
    })

    it('Should search users by name/email', async () => {
        const targetUser = await prisma.user.findFirst({
            where: {
                role: UserRole.User,
                deletedAt: null 
            }
        })

        const searchTerm = targetUser.firstName.slice(0, 3)

        const res = await supertest(app)
            .get(adminEndpoint())
            .set('Cookie', sessionCookie)
            .query({
                page: 1,
                limit: 10,
                search: searchTerm
            })

        expect(res.statusCode).to.eq(200)

        const validation = UsersController.schemas.response.getUsers.validate(res.body)
        expect(validation.error).to.eq(undefined)

        expect(res.body.users.length).to.be.gte(1)
    })
})

describe(`PATCH ${endpoint(':userID')}`, () => {
    let userID: string
    let sessionCookie: string

    before(async () => {
        const user = await prisma.user.findFirst({
            where: {
                role: UserRole.User,
                deletedAt: null 
            }
        })

        userID = user.id

        sessionCookie = await loginUserAndGetCookie({
            email: user.email,
            password
        })
    })

    it('Should update user (200)', async () => {
        const res = await supertest(app)
            .patch(endpoint(userID))
            .set('Content-Type', 'application/json')
            .set('Cookie', sessionCookie)
            .send({
                firstName: 'Updated',
                lastName: 'Name',
                avatar: 'https://example.com/avatar.jpg'
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validation = UsersController.schemas.response.patchUser.validate(res.body)
        expect(validation.error).to.eq(undefined)

        expect(res.body.user.id).to.eq(userID)
    })

    it('Should return 400 when body is empty', async () => {
        const res = await supertest(app)
            .patch(endpoint(userID))
            .set('Content-Type', 'application/json')
            .set('Cookie', sessionCookie)
            .send({})

        expect(res.statusCode).to.equal(400)
    })

    it('Should return 403 for attempt to update another user', async () => {
        const anotherUser = await prisma.user.findFirst({
            where: {
                id: { not: userID },
                role: UserRole.User,
                deletedAt: null
            }
        })
        const res = await supertest(app)
            .patch(endpoint(anotherUser.id))
            .set('Content-Type', 'application/json')
            .set('Cookie', sessionCookie)
            .send({
                firstName: 'Test'
            })

        expect(res.statusCode).to.equal(403)
    })
})

describe('DELETE ' + endpoint(), () => {
    it('Should delete user (200)', async () => {
        const user = await prisma.user.findFirst({ where: { role: UserRole.User } })
        const sessionCookie = await loginUserAndGetCookie({
            email: user.email,
            password: password
        })

        const res = await supertest(app)
            .delete(endpoint(''))
            .set('Content-Type', 'application/json')
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = UsersController.schemas.response.deleteUser.validate(res.body)
        expect(validationResult.error).to.eq(undefined)

        expect(!!(await prisma.user.findFirst({
            where: {
                id: user.id,
                deletedAt: null
            }
        }))).to.equal(false)
    })
})