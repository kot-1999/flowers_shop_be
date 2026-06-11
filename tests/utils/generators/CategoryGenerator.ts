import { faker } from '@faker-js/faker'
import { Category, Translation } from '@prisma/client';
import dayjs from 'dayjs'

import prisma from '../../../src/services/Prisma'
import { Language, Languages } from '../../../src/utils/enums';
import LocalizedFaker from '../LocalizedFaker';

export default class CategoryGenerator {
    public static generateCategory(categoryData: Partial<Category> & { name?: Partial<Translation>,  description?: Partial<Translation>} = {} = {}) {
        const data = CategoryGenerator.generateData(categoryData)
        return prisma.category.create({
            data: {
                ...data,
                name: {
                    create: data.name
                },
                description: {
                    create: data.description
                }
            }
        })
    }

    public static generateData(categoryData: Partial<Category> & { name?: Partial<Translation>,  description?: Partial<Translation>} = {}) {
        const id = categoryData.id ?? faker.string.uuid()

        return {
            id,
            coverImage: categoryData.coverImage ?? null,
            name: categoryData.name ?? {
                id: faker.string.uuid(),
                ...Object.fromEntries(Languages.map((lang: Language) => [
                    lang,
                    LocalizedFaker.safeCall(LocalizedFaker.get(lang).commerce.department)
                ]))
            },

            description: categoryData.description ?? {
                id: faker.string.uuid(),
                ...Object.fromEntries(Languages.map((lang: Language) => [
                    lang,
                    LocalizedFaker.safeCall(LocalizedFaker.get(lang).commerce.productDescription)
                ]))
            },

            createdAt: categoryData.createdAt ?? dayjs().toISOString(),
            updatedAt: categoryData.updatedAt ?? dayjs().toISOString(),
            deletedAt: categoryData.deletedAt ?? null
        }
    }
}