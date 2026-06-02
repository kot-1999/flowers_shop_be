import { faker } from '@faker-js/faker'
import { UserRole } from '@prisma/client';
import { expect } from 'chai'
import supertest from 'supertest'

import app from '../../../../src/app'
import { UsersController } from '../../../../src/controllers/v1/UserController'
import prisma from '../../../../src/services/Prisma'
import { loginUserAndGetCookie } from '../../../utils/helpers';

const endpoint = (val: string = '') => '/api/v1/user/' + val

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