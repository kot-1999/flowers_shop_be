import { faker } from '@faker-js/faker';
import { UserRole } from '@prisma/client'
import { expect } from 'chai'
import dayjs from 'dayjs';
import supertest from 'supertest'

import app from '../../../../src/app'
import { TagController } from '../../../../src/controllers/v1/TagController'
import prisma from '../../../../src/services/Prisma'
import { Language, Languages } from '../../../../src/utils/enums';
import TagGenerator from '../../../utils/generators/TagGenerator';
import { loginUserAndGetCookie } from '../../../utils/helpers'

const publicEndpoint = '/api/v1/tags'
const adminEndpoint = (val: string = '') => '/api/v1/admin/tags/' + val

const password = 'Test123'

describe(`GET ${publicEndpoint}`, () => {
    
    it('Should return tags (200)', async () => {
        const res = await supertest(app)
            .get(publicEndpoint)
            .query({
                page: 1,
                limit: 10 
            })
            .set('Content-Type', 'application/json')

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validation = TagController.schemas.response.getTags.validate(res.body)
        expect(validation.error).to.eq(undefined)
    })

    it('Should search tags (200)', async () => {
        await TagGenerator.generateTag({
            name: Object.fromEntries(Languages.map((lang: Language) => [
                lang,
                'Miniature Flower'
            ]))
        })
        const res = await supertest(app)
            .get(publicEndpoint)
            .query({
                page: 1,
                limit: 10,
                search: 'flower'
            })
            .set('Content-Type', 'application/json')

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validation = TagController.schemas.response.getTags.validate(res.body)
        expect(validation.error).to.eq(undefined)
    })
})

describe(`GET ${adminEndpoint()}`, () => {
    let sessionCookie: string

    before(async () => {
        const admin = await prisma.user.findFirst({
            where: {
                role: UserRole.Admin,
                deletedAt: null
            }
        })

        sessionCookie = await loginUserAndGetCookie({
            email: admin.email,
            password
        })
    })

    it('Should return admin tags (200)', async () => {
        const res = await supertest(app)
            .get(adminEndpoint())
            .query({
                page: 1,
                limit: 10 
            })
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validation = TagController.schemas.response.getAdminTags.validate(res.body)
        expect(validation.error).to.eq(undefined)
    })

    it('Should search admin tags (200)', async () => {
        await TagGenerator.generateTag({
            name: Object.fromEntries(Languages.map((lang: Language) => [
                lang,
                'Standart Flower'
            ]))
        })
        const res = await supertest(app)
            .get(adminEndpoint())
            .query({
                page: 1,
                limit: 10,
                search: 'Stan flow'
            })
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validation = TagController.schemas.response.getAdminTags.validate(res.body)
        expect(validation.error).to.eq(undefined)
    })
})

describe(`PUT ${adminEndpoint()}`, () => {
    let sessionCookie: string

    before(async () => {
        const admin = await prisma.user.findFirst({
            where: {
                role: UserRole.Admin,
                deletedAt: null
            }
        })

        sessionCookie = await loginUserAndGetCookie({
            email: admin.email,
            password
        })
    })

    it('Should create tag (200)', async () => {
        const tagData = TagGenerator.generateData()

        delete tagData.name.id

        const res = await supertest(app)
            .put(adminEndpoint())
            .set('Cookie', sessionCookie)
            .send({
                nameTranslations: tagData.name
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validation
            = TagController.schemas.response.putTag.validate(res.body)

        expect(validation.error).to.eq(undefined)
        expect(res.body.tag).to.have.property('id')
    })

    it('Should update tag translation (200)', async () => {
        const existing = await prisma.tag.findFirst({
            where: { deletedAt: null }
        })

        const newData = TagGenerator.generateData()

        delete newData.name.id

        const res = await supertest(app)
            .put(adminEndpoint())
            .set('Cookie', sessionCookie)
            .send({
                tagID: existing.id,
                nameTID: existing.nameTID,
                nameTranslations: newData.name
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validation = TagController.schemas.response.putTag.validate(res.body)
        expect(validation.error).to.eq(undefined)
    })

    it('Should restore deleted tag (200)', async () => {
        const tag = await TagGenerator.generateTag({
            deletedAt: dayjs().toISOString()
        } as any)

        const res = await supertest(app)
            .put(adminEndpoint())
            .set('Cookie', sessionCookie)
            .send({
                tagID: tag.id,
                nameTID: tag.nameTID,
                restore: true
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const updated = await prisma.tag.findUnique({
            where: { id: tag.id }
        })

        expect(updated.deletedAt).to.eq(null)
    })

    it('Should return 404 for missing tag', async () => {
        const name = TagGenerator.generateData().name
        delete name.id

        const res = await supertest(app)
            .put(adminEndpoint())
            .set('Cookie', sessionCookie)
            .send({
                tagID: faker.string.uuid(),
                nameTranslations: name
            })

        expect(res.statusCode).to.equal(404)
    })
})

describe(`DELETE ${adminEndpoint(':tagID')}`, () => {
    let sessionCookie: string

    before(async () => {
        const admin = await prisma.user.findFirst({
            where: {
                role: UserRole.Admin,
                deletedAt: null
            }
        })

        sessionCookie = await loginUserAndGetCookie({
            email: admin.email,
            password
        })
    })

    it('Should soft delete tag (200)', async () => {
        const tag = await prisma.tag.findFirst({
            where: { deletedAt: null }
        })

        const res = await supertest(app)
            .delete(adminEndpoint(tag.id))
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validation
            = TagController.schemas.response.deleteTag.validate(res.body)

        expect(validation.error).to.eq(undefined)

        const deleted = await prisma.tag.findUnique({
            where: { id: tag.id }
        })

        expect(deleted.deletedAt).to.not.eq(null)
    })

    it('Should return 404 for missing tag', async () => {
        const res = await supertest(app)
            .delete(adminEndpoint(faker.string.uuid()))
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(404)
    })
})