import { faker } from '@faker-js/faker';
import { UserRole } from '@prisma/client';
import { expect } from 'chai';
import supertest from 'supertest';

import app from '../../../../src/app';
import { CategoryController } from '../../../../src/controllers/v1/CategoryController';
import prisma from '../../../../src/services/Prisma';
import CategoryGenerator from '../../../utils/CategoryGenerator';
import { loginUserAndGetCookie } from '../../../utils/helpers';

const endpoint = (val = '') => '/api/v1/admin/categories/' + val;
const publicEndpoint = '/api/v1/categories';

const password = 'Test123';

describe('GET ' + publicEndpoint, () => {
    it('Should return categories (200)', async () => {
        const res = await supertest(app)
            .get(publicEndpoint)
            .set('Content-Type', 'application/json');

        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult
            = CategoryController.schemas.response.getCategories.validate(res.body);

        expect(validationResult.error).to.eq(undefined);
    });
});

describe(`GET ${endpoint()}`, () => {
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

    it('Should return admin categories (200)', async () => {
        const res = await supertest(app)
            .get('/api/v1/admin/categories')
            .set('Cookie', sessionCookie)

        expect(res.statusCode).to.equal(200);
    });
});

describe(`PUT ${endpoint()}`, () => {
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

    it('Should create category (200)', async () => {
        const categoryData = CategoryGenerator.generateData()
        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                nameTranslations: categoryData.name,
                descriptionTranslations: categoryData.description
            });
        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult
            = CategoryController.schemas.response.putCategory.validate(res.body);
        expect(validationResult.error).to.eq(undefined);
    });

    it('Should update category (200)', async () => {
        const categoryData = await prisma.category.findFirst()
        const categoryData2 = CategoryGenerator.generateData()

        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                categoryID: categoryData.id,
                nameTID: categoryData.nameTID,
                descriptionTranslations: categoryData2.description
            });

        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult
            = CategoryController.schemas.response.putCategory.validate(res.body);

        expect(validationResult.error).to.eq(undefined);
    });

    it('Translation does not exist (404)', async () => {
        const categoryData = await prisma.category.findFirst()
        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                categoryID: categoryData.id,
                nameTID: faker.string.uuid(),
                descriptionTID: categoryData.descriptionTID
            });

        expect(res.statusCode).to.equal(404);
    });

    it('Category doesnt exist (404)', async () => {
        const categoryData = await prisma.category.findFirst()
        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                categoryID: faker.string.uuid(),
                nameTID: categoryData.nameTID,
                descriptionTID: categoryData.descriptionTID
            });

        expect(res.statusCode).to.equal(404);
    });
});

describe(`DELETE ${endpoint(':categoryID')}`, () => {
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

    it('Should delete category (200)', async () => {
        const categoryData = await prisma.category.findFirst({ where: { deletedAt: null } })
        const res = await supertest(app)
            .delete(endpoint(categoryData.id))
            .set('Cookie', sessionCookie)
        console.log(res.error)

        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult
            = CategoryController.schemas.response.deleteCategory.validate(res.body);

        expect(validationResult.error).to.eq(undefined);
    });
});