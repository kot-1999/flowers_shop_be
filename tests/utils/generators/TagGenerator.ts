import { faker } from '@faker-js/faker'
import { Tag, Translation } from '@prisma/client'

import prisma from '../../../src/services/Prisma'
import { Language, Languages } from '../../../src/utils/enums'
import LocalizedFaker from '../LocalizedFaker';

export default class TagGenerator {
    public static generateTag(data: Partial<Tag> & { name?: Partial<Translation> } = {}) {
        const payload = TagGenerator.generateData(data)

        return prisma.tag.create({
            data: {
                ...payload,
                name: {
                    create: payload.name
                }
            }
        })
    }

    public static generateData(data: Partial<Tag> & { name?: Partial<Translation> } = {}) {
        const id = data.id ?? faker.string.uuid()

        return {
            id,

            name: data.name ?? Object.fromEntries(Languages.map((lang: Language) => [
                lang,
                LocalizedFaker.safeCall(LocalizedFaker.get(lang).commerce.productAdjective, 2)
            ])),

            createdAt: data.createdAt ?? new Date(),
            updatedAt: data.updatedAt ?? new Date(),
            deletedAt: data.deletedAt ?? null
        }
    }
}