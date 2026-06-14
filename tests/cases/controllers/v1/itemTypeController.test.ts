import { faker } from '@faker-js/faker'
import { UserRole } from '@prisma/client'
import { expect } from 'chai'
import supertest from 'supertest'

import app from '../../../../src/app'
import { ItemTypeController } from '../../../../src/controllers/v1/ItemTypeController'
import prisma from '../../../../src/services/Prisma'
import ItemTypeGenerator from '../../../utils/generators/ItemTypeGenerator'
import { loginUserAndGetCookie } from '../../../utils/helpers'

const endpoint = (val = '') => '/api/v1/admin/item-types/' + val
const password = 'Test123'

describe(`GET ${endpoint()}`, () => {
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

    it('Should return item types (200)', async () => {
        await prisma.itemType.create({
            data: {
                ...ItemTypeGenerator.generateData(),
                name: {
                    create: ItemTypeGenerator.generateData().name
                }
            }
        })

        const res = await supertest(app)
            .get(endpoint())
            .set('Cookie', sessionCookie)
            .set('accept-language', 'en')
            .query({
                page: 1,
                limit: 10,
                sort: 'asc'
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = ItemTypeController.schemas.response.getItemTypes.validate(res.body)

        expect(validationResult.error).to.eq(undefined)
    })

    it('Should support search filtering', async () => {

        const item = await ItemTypeGenerator.generateItemType({
            name: {
                en: 'SpecialTestItem',
                ua: 'SpecialTestItem',
                de: 'SpecialTestItem',
                sk: 'SpecialTestItem'
            }
        })

        const res = await supertest(app)
            .get(endpoint())
            .set('Cookie', sessionCookie)
            .set('accept-language', 'en')
            .query({
                search: 'SpecialTestItem'
            })
        expect(res.statusCode).to.equal(200)

        const found = res.body.itemTypes.some((t: any) => t.id === item.id)

        expect(found).to.eq(true)
    })
})

describe(`PUT ${endpoint()}`, () => {
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
            password: 'Test123'
        })
    })

    it('Should create item type (200)', async () => {
        const data = ItemTypeGenerator.generateData()

        delete data.name.id

        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                nameTranslations: data.name,
                weight: 10
            })

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult = ItemTypeController.schemas.response.putItemType.validate(res.body)

        expect(validationResult.error).to.eq(undefined)
    })

    it('Should update item type (200)', async () => {
        const existing = await prisma.itemType.findFirst({
            where: { deletedAt: null }
        })

        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                itemTypeID: existing.id,
                nameTID: existing.nameTID,
                weight: 25
            })

        expect(res.statusCode).to.equal(200)

        const validationResult = ItemTypeController.schemas.response.putItemType.validate(res.body)

        expect(validationResult.error).to.eq(undefined)
    })

    it('Should return 404 when item type does not exist', async () => {
        const name = ItemTypeGenerator.generateData().name
        delete name.id
        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                itemTypeID: faker.string.uuid(),
                nameTranslations: name,
                weight: 10
            })

        expect(res.statusCode).to.equal(404)
    })

    it('Should return 404 when translation does not exist', async () => {
        const existing = await prisma.itemType.findFirst({
            where: { deletedAt: null }
        })

        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                itemTypeID: existing.id,
                nameTID: faker.string.uuid(),
                weight: 10
            })

        expect(res.statusCode).to.equal(404)
    })
})

describe(`DELETE ${endpoint(':itemTypeID')}`, () => {
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
            password: 'Test123'
        })
    })

    it('Should delete item type (200)', async () => {
        const itemType = await ItemTypeGenerator.generateItemType()

        const res = await supertest(app)
            .delete(endpoint(itemType.id))
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(200)
        expect(res.type).to.eq('application/json')

        const validationResult
            = ItemTypeController.schemas.response.deleteItemType.validate(res.body)

        expect(validationResult.error).to.eq(undefined)
    })

    it('Item appears in pricings (403)', async () => {
        const itemType = await prisma.itemType.findFirst({
            where: { deletedAt: null }
        })

        const res = await supertest(app)
            .delete(endpoint(itemType.id))
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(403)
    })

    it('Should return 404 when item type does not exist', async () => {
        const res = await supertest(app)
            .delete(endpoint(faker.string.uuid()))
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(404)
    })
})