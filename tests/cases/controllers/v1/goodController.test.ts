import { faker } from '@faker-js/faker';
import { GoodState, UserRole } from '@prisma/client';
import { expect } from 'chai';
import dayjs from 'dayjs';
import supertest from 'supertest';

import app from '../../../../src/app';
import { GoodController } from '../../../../src/controllers/v1/GoodController';
import prisma from '../../../../src/services/Prisma';
import { Language, Languages } from '../../../../src/utils/enums';
import { GoodGenerator } from '../../../utils/generators/GoodGenerator';
import { loginUserAndGetCookie } from '../../../utils/helpers';

const publicEndpoint  = (val = '') =>  '/api/v1/goods/' + val;
const adminEndpoint = (val = '') => `/api/v1/admin/goods/${val}`;

const password = 'Test123';

describe(`GET ${publicEndpoint()}`, () => {
    it('Should return goods (200)', async () => {
        const res = await supertest(app)
            .get(publicEndpoint())
            .query({
                page: 1,
                limit: 10
            })
            .set('Content-Type', 'application/json');
        expect(res.statusCode).to.eq(200);
        expect(res.type).to.eq('application/json');

        const validation = GoodController.schemas.response.getGoods.validate(res.body);
        expect(validation.error).to.eq(undefined);
    });

    it('Should filter by category', async () => {
        const category = await prisma.category.findFirst({
            select: { id: true },
            where: { deletedAt: null } 
        });

        const res = await supertest(app)
            .get(publicEndpoint())
            .query({
                page: 1,
                limit: 10,
                categoryID: category.id
            });

        expect(res.statusCode).to.eq(200);
        expect(res.type).to.eq('application/json');

        const validation = GoodController.schemas.response.getGoods.validate(res.body);

        expect(validation.error).to.eq(undefined)

        expect(res.body.goods.length).to.be.gte(1);
    });

    it('Should filter by state', async () => {
        const res = await supertest(app)
            .get(publicEndpoint())
            .query({
                page: 1,
                limit: 10,
                'state[]': [GoodState.Available]
            });

        expect(res.statusCode).to.eq(200);
        expect(res.type).to.eq('application/json');

        const validation = GoodController.schemas.response.getGoods.validate(res.body);

        expect(validation.error).to.eq(undefined)

        expect(res.body.goods.every((g: any) => g.state === GoodState.Available))
            .to.eq(true);
    });

    it('Should search goods', async () => {
        await GoodGenerator.generateGood({
            name: Object.fromEntries(Languages.map((lang: Language) => [
                lang,
                'Test value'
            ]))
        });
        const res = await supertest(app)
            .get(publicEndpoint())
            .query({
                page: 1,
                limit: 10,
                search: 'te va'
            });

        expect(res.statusCode).to.eq(200);
        expect(res.type).to.eq('application/json');

        const validation = GoodController.schemas.response.getGoods.validate(res.body);

        expect(validation.error).to.eq(undefined)

        expect(res.body.goods.length).to.be.gte(1);
    });

    it('Should filter by selectionist', async () => {
        const results = await prisma.selectionist.findMany({
            select: { id: true },
            where: { deletedAt: null },
            take: 3
        });

        const res = await supertest(app)
            .get(publicEndpoint())
            .query({
                page: 1,
                limit: 10,
                'selectionistIDs[]': results.map((item: { id: string }) => item.id)
            });

        expect(res.statusCode).to.eq(200);
        expect(res.type).to.eq('application/json');

        const validation = GoodController.schemas.response.getGoods.validate(res.body);

        expect(validation.error).to.eq(undefined)

        expect(res.body.goods.length).to.be.gte(3);
    });

    it('Should filter by item types', async () => {
        const results = await prisma.itemType.findMany({
            select: { id: true },
            where: { deletedAt: null },
            take: 3
        });

        const res = await supertest(app)
            .get(publicEndpoint())
            .query({
                page: 1,
                limit: 10,
                'itemTypeIDs[]': results.map((item: { id: string }) => item.id)
            });

        expect(res.statusCode).to.eq(200);
        expect(res.type).to.eq('application/json');

        const validation = GoodController.schemas.response.getGoods.validate(res.body);

        expect(validation.error).to.eq(undefined)

        expect(res.body.goods.length).to.be.gte(3);
    });

    it('Should filter by tags', async () => {
        const results = await prisma.tag.findMany({
            select: { id: true },
            where: { deletedAt: null },
            take: 3
        });

        const res = await supertest(app)
            .get(publicEndpoint())
            .query({
                page: 1,
                limit: 10,
                'tagIDs[]': results.map((item: { id: string }) => item.id)
            });

        expect(res.statusCode).to.eq(200);
        expect(res.type).to.eq('application/json');

        const validation = GoodController.schemas.response.getGoods.validate(res.body);
        expect(validation.error).to.eq(undefined)

        expect(res.body.goods.length).to.be.gte(3);
    });

    it('Should apply sort', async () => {
        const res = await supertest(app)
            .get(publicEndpoint())
            .query({
                page: 1,
                limit: 10,
                sortOrder: 'asc',
                sortBy: 'selectionist'
            });

        expect(res.statusCode).to.eq(200);
        expect(res.type).to.eq('application/json');

        const validation = GoodController.schemas.response.getGoods.validate(res.body);

        expect(validation.error).to.eq(undefined)
    });
});

describe(`GET ${publicEndpoint(':goodID')}`, () => {
    it('Should return single good (200)', async () => {
        const good = await prisma.good.findFirst({
            where: { deletedAt: null },
            select: { id: true } 
        });

        const res = await supertest(app)
            .get(`${publicEndpoint(good.id)}`);
        expect(res.statusCode).to.eq(200);

        const validation = GoodController.schemas.response.getGood.validate(res.body);

        expect(validation.error).to.eq(undefined);
        expect(res.body.good.id).to.eq(good.id);
    });

    it('Should return 404 for deleted good', async () => {
        const good = await prisma.good.findFirst({
            where: { deletedAt: null },
            select: { id: true }
        });

        await prisma.good.update({
            where: {
                id: good.id
            },
            data: {
                deletedAt: dayjs().toISOString(),
                state: GoodState.Deleted
            }
        })

        const res = await supertest(app)
            .get(`${publicEndpoint(good.id)}`);
        expect(res.statusCode).to.eq(404);
    });

    it('Should return 404 for missing good', async () => {
        const res = await supertest(app)
            .get(`${publicEndpoint(faker.string.uuid())}`);

        expect(res.statusCode).to.eq(404);
    });
});

describe(`POST ${adminEndpoint()}`, () => {
    let sessionCookie: string;
    let payload: any
    before(async () => {
        const admin = await prisma.user.findFirst({
            where: {
                role: UserRole.Admin,
                deletedAt: null 
            }
        });

        sessionCookie = await loginUserAndGetCookie({
            email: admin.email,
            password
        });

        const payloadTmp = await GoodGenerator.generateData();
        delete payloadTmp.name.id
        delete payloadTmp.description.id
        payload = {
            categoryID: payloadTmp.categoryID,
            selectionistID: payloadTmp.selectionistID,
            tagIDs: payloadTmp.tagIDs,
            nameTranslations: payloadTmp.name,
            descriptionTranslations: payloadTmp.description,
            action: 'show',
            photos: [],
            pricings: payloadTmp.pricings.map((item) => ({
                itemTypeID: item.itemTypeID,
                price: item.price,
                quantity: item.quantity
            }))
        }
    });

    it('Should create good (200)', async () => {

        const res = await supertest(app)
            .post(adminEndpoint())
            .set('Cookie', sessionCookie)
            .send(payload)
        expect(res.statusCode).to.eq(200);

        const validation = GoodController.schemas.response.postGood.validate(res.body);

        expect(validation.error).to.eq(undefined);
        expect(res.body.good).to.have.property('id');
    });

    it('Should return 404 for fake categoryID', async () => {

        const res = await supertest(app)
            .post(adminEndpoint())
            .set('Cookie', sessionCookie)
            .send({
                ...payload,
                categoryID: faker.string.uuid()
            })

        expect(res.statusCode).to.eq(404);
    });

    it('Should return 404 for fake selectionistID', async () => {

        const res = await supertest(app)
            .post(adminEndpoint())
            .set('Cookie', sessionCookie)
            .send({
                ...payload,
                selectionistID: faker.string.uuid()
            })

        expect(res.statusCode).to.eq(404);
    });

    it('Should return 404 for fake tagIDs', async () => {

        const res = await supertest(app)
            .post(adminEndpoint())
            .set('Cookie', sessionCookie)
            .send({
                ...payload,
                tagIDs: [faker.string.uuid(), faker.string.uuid()]
            })

        expect(res.statusCode).to.eq(404);
    });

    it('Should return 404 for fake itemTypeID', async () => {

        const res = await supertest(app)
            .post(adminEndpoint())
            .set('Cookie', sessionCookie)
            .send({
                ...payload,
                pricings: payload.pricings.map((item: any) => ({
                    ...item,
                    itemTypeID: faker.string.uuid()
                }))
            })

        expect(res.statusCode).to.eq(404);
    });
});

describe(`PATCH ${adminEndpoint(':goodID')}`, () => {
    let sessionCookie: string;
    let payload: any
    before(async () => {
        const admin = await prisma.user.findFirst({
            where: {
                role: UserRole.Admin,
                deletedAt: null 
            }
        });

        sessionCookie = await loginUserAndGetCookie({
            email: admin.email,
            password
        });

        const payloadTmp = await GoodGenerator.generateData();
        delete payloadTmp.name.id
        delete payloadTmp.description.id
        payload = {
            categoryID: payloadTmp.categoryID,
            selectionistID: payloadTmp.selectionistID,
            tagIDs: payloadTmp.tagIDs,
            nameTranslations: payloadTmp.name,
            descriptionTranslations: payloadTmp.description,
            action: 'show',
            photos: [],
            pricings: payloadTmp.pricings.map((item) => ({
                itemTypeID: item.itemTypeID,
                price: item.price,
                quantity: item.quantity
            }))
        }
    });

    it('Should update good (200)', async () => {
        const goodTmp = await prisma.good.findFirst({ where: { deletedAt: null } })
        const goodRes = await supertest(app)
            .get(`${publicEndpoint(goodTmp.id)}`);

        const { good } = goodRes.body
        payload.pricings.push({
            pricingID: good.pricings[0].id,
            itemTypeID: good.pricings[0].itemType.id,
            price: 23,
            quantity: 44
        })
        
        const res = await supertest(app)
            .patch(adminEndpoint(good.id))
            .set('Cookie', sessionCookie)
            .send(payload);

        expect(res.statusCode).to.eq(200);

        const validation
            = GoodController.schemas.response.patchGood.validate(res.body);

        expect(validation.error).to.eq(undefined);
    });

    it('Should return 404 for missing good', async () => {
        const res = await supertest(app)
            .patch(adminEndpoint(faker.string.uuid()))
            .set('Cookie', sessionCookie)
            .send({
                photos: ['https://example.com/a.jpg']
            });

        expect(res.statusCode).to.eq(404);
    });
});

describe(`DELETE ${adminEndpoint(':goodID')}`, () => {
    let sessionCookie: string;

    before(async () => {
        const admin = await prisma.user.findFirst({
            where: {
                role: UserRole.Admin,
                deletedAt: null 
            }
        });

        sessionCookie = await loginUserAndGetCookie({
            email: admin.email,
            password
        });
    });

    it('Should soft delete good (200)', async () => {
        const good = await prisma.good.findFirst({ where: { deletedAt: null } });

        const res = await supertest(app)
            .delete(adminEndpoint(good.id))
            .set('Cookie', sessionCookie);

        expect(res.statusCode).to.eq(200);

        const validation = GoodController.schemas.response.deleteGood.validate(res.body);
        expect(validation.error).to.eq(undefined);

        const deleted = await prisma.good.findFirst({
            where: { id: good.id }
        });

        expect(deleted?.deletedAt).to.not.eq(null);
        expect(deleted?.state).to.eq(GoodState.Deleted)
    });

    it('Should return 404 for missing good', async () => {
        const res = await supertest(app)
            .delete(adminEndpoint(faker.string.uuid()))
            .set('Cookie', sessionCookie);

        expect(res.statusCode).to.eq(404);
    });
});