import { faker } from '@faker-js/faker'
import { Category, Translation } from '@prisma/client';
import dayjs from 'dayjs'

import prisma from '../../src/services/Prisma'

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
                en: faker.commerce.department(),
                ua: faker.commerce.department(),
                sk: faker.commerce.department(),
                de: faker.commerce.department()
            },

            description: categoryData.description ?? {
                en: faker.commerce.productDescription(),
                ua: faker.commerce.productDescription(),
                sk: faker.commerce.productDescription(),
                de: faker.commerce.productDescription()
            },

            createdAt: categoryData.createdAt ?? dayjs().toISOString(),
            updatedAt: categoryData.updatedAt ?? dayjs().toISOString(),
            deletedAt: categoryData.deletedAt ?? null
        }
    }
}