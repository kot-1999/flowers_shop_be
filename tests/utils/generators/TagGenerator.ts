import { faker } from '@faker-js/faker'
import { Tag, Translation } from '@prisma/client'

import prisma from '../../../src/services/Prisma'
import { Language, Languages } from '../../../src/utils/enums'
import LocalizedFaker from '../LocalizedFaker';

const safeCall = (fn: () => string | undefined) => {
    try {
        const res = fn()
        return res && typeof res === 'string' ? res : null
    } catch {
        return null
    }
}

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

            name:
                data.name
                ?? Object.fromEntries(Languages.map((lang: Language) => {
                    const f = LocalizedFaker.get(lang)

                    const adjective
                            = safeCall(() => f.word?.adjective?.())
                            ?? safeCall(() => f.word?.noun?.())
                            ?? f.string.alpha({
                                length: {
                                    min: 5,
                                    max: 8 
                                } 
                            })

                    const noun
                            = safeCall(() => f.word?.noun?.())
                            ?? safeCall(() => f.word?.sample?.())
                            ?? f.string.alpha({
                                length: {
                                    min: 4,
                                    max: 7 
                                } 
                            })

                    return [
                        lang,
                        f.datatype.boolean()
                            ? adjective
                            : `${adjective} ${noun}`
                    ]
                })),

            createdAt: data.createdAt ?? new Date(),
            updatedAt: data.updatedAt ?? new Date(),
            deletedAt: data.deletedAt ?? null
        }
    }
}