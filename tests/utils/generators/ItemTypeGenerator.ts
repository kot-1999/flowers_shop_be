import { faker } from '@faker-js/faker'
import { ItemType, Translation } from '@prisma/client'
import dayjs from 'dayjs'

import prisma from '../../../src/services/Prisma'
import { Language, Languages } from '../../../src/utils/enums';

export default class ItemTypeGenerator {
    public static generateItemType(data: Partial<ItemType> & { name?: Partial<Translation> } = {}) {
        const item = this.generateData(data)

        return prisma.itemType.create({
            data: {
                ...item,
                name: {
                    create: item.name
                }
            }
        })
    }

    public static generateData(data: Partial<ItemType> & { name?: Partial<Translation> } = {}) {
        const id = faker.string.uuid()

        return {
            id,
            name: data.name ?? data.name
                ?? Object.fromEntries(Languages.map((lang: Language) => [
                    lang,
                    faker.commerce.product()
                ])),
            weight: data.weight ?? faker.number.int({
                min: 1,
                max: 999 
            }),
            createdAt: data.createdAt ?? dayjs().toISOString(),
            updatedAt: data.updatedAt ?? dayjs().toISOString(),
            deletedAt: data.deletedAt ?? null
        }
    }
}