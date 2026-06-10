import { faker } from '@faker-js/faker';
import { Country, UserRole } from '@prisma/client';
import { expect } from 'chai';
import supertest from 'supertest';

import app from '../../../../src/app';
import { SelectionistController } from '../../../../src/controllers/v1/SelectionistController';
import prisma from '../../../../src/services/Prisma';
import { loginUserAndGetCookie } from '../../../utils/helpers';
import SelectionistGenerator from '../../../utils/generators/SelectionistGenerator';

const publicEndpoint = (val = '') => '/api/v1/selectionists/' + val;
const endpoint = (val = '') => '/api/v1/admin/selectionists/' + val;

const password = 'Test123';

describe(`GET ${publicEndpoint()}`, () => {
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

    it('Should return selectionists (200)', async () => {
        const res = await supertest(app)
            .get(publicEndpoint())
            .set('accept-language', 'en')
            .query({
                page: 1,
                limit: 10,
                sort: 'asc'
            });

        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult = SelectionistController.schemas.response.getSelectionists.validate(res.body);

        expect(validationResult.error).to.eq(undefined);
    });

    it('Should support search filtering', async () => {
        const selectionist = await SelectionistGenerator.generateSelectionist({
            name: {
                en: 'SpecialSelectionist',
                ua: 'SpecialSelectionist',
                de: 'SpecialSelectionist',
                sk: 'SpecialSelectionist'
            }
        });

        const res = await supertest(app)
            .get(publicEndpoint())
            .set('Cookie', sessionCookie)
            .set('accept-language', 'en')
            .query({
                search: 'SpecialSelectionist',
                page: 1,
                limit: 10
            });

        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult = SelectionistController.schemas.response.getSelectionists.validate(res.body);

        expect(validationResult.error).to.eq(undefined);

        const found = res.body.selectionists.some((s: any) => s.id === selectionist.id);

        expect(found).to.eq(true);
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

    it('Should create selectionist (200)', async () => {
        const data = SelectionistGenerator.generateData();

        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                nameTranslations: data.name,
                country: Country.Azerbaijan
            });

        expect(res.statusCode).to.equal(200);
        expect(res.type).to.eq('application/json');

        const validationResult = SelectionistController.schemas.response.putSelectionist.validate(res.body);

        expect(validationResult.error).to.eq(undefined);
    });

    it('Should update selectionist (200)', async () => {
        const selectionist = await prisma.selectionist.findFirst({
            where: { deletedAt: null }
        });

        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                selectionistID: selectionist.id,
                nameTID: selectionist.nameTID,
                country: Country.Estonia
            });

        expect(res.statusCode).to.equal(200);

        const validationResult = SelectionistController.schemas.response.putSelectionist.validate(res.body);

        expect(validationResult.error).to.eq(undefined);
    });

    it('Selectionist does not exist (404)', async () => {
        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                selectionistID: faker.string.uuid(),
                country: Country.Slovenia,
                nameTranslations: SelectionistGenerator.generateData().name
            });

        expect(res.statusCode).to.equal(404);
    });

    it('Translation does not exist (404)', async () => {
        const selectionist = await prisma.selectionist.findFirst({
            where: { deletedAt: null }
        });

        const res = await supertest(app)
            .put(endpoint())
            .set('Cookie', sessionCookie)
            .send({
                selectionistID: selectionist.id,
                nameTID: faker.string.uuid(),
                country: Country.Ukraine
            });

        expect(res.statusCode).to.equal(404);
    });
});