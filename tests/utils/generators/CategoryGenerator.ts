import { faker } from '@faker-js/faker'
import { Category, Translation } from '@prisma/client';
import dayjs from 'dayjs'

import prisma from '../../../src/services/Prisma'
import { Language, Languages } from '../../../src/utils/enums';

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
            name: categoryData.name ?? Object.fromEntries(Languages.map((lang: Language) => [
                lang,
                faker.commerce.department()
            ])),

            description: categoryData.description ?? Object.fromEntries(Languages.map((lang: Language) => [
                lang,
                faker.commerce.productDescription()
            ])),

            createdAt: categoryData.createdAt ?? dayjs().toISOString(),
            updatedAt: categoryData.updatedAt ?? dayjs().toISOString(),
            deletedAt: categoryData.deletedAt ?? null
        }
    }
}