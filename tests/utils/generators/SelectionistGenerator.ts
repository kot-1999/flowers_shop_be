import { faker } from '@faker-js/faker'
import { Country, Selectionist, Translation } from '@prisma/client'

import prisma from '../../../src/services/Prisma'
import { Language, Languages } from '../../../src/utils/enums';
import LocalizedFaker from '../LocalizedFaker';

export default class SelectionistGenerator {
    public static generateSelectionist(data: Partial<Selectionist> & {
            name?: Partial<Translation>
        } = {}) {
        const payload = SelectionistGenerator.generateData(data)

        return prisma.selectionist.create({
            data: {
                ...payload,
                name: {
                    create: payload.name
                }
            }
        })
    }

    public static generateData(data: Partial<Selectionist> & {
            name?: Partial<Translation>
        } = {}) {
        const id = data.id ?? faker.string.uuid()

        return {
            id,
            country: data.country
                ?? faker.helpers.maybe(
                    () => faker.helpers.arrayElement(Object.values(Country)),
                    { probability: 0.8 }
                ) ?? null,
            name:
                data.name ?? data.name
                ?? {
                    id: faker.string.uuid(),
                    ...Object.fromEntries(Languages.map((lang: Language) => [
                        lang,
                        LocalizedFaker.get(lang).person.fullName()
                    ]))
                },
            createdAt: data.createdAt ?? new Date(),
            updatedAt: data.updatedAt ?? new Date(),
            deletedAt: data.deletedAt ?? null
        }
    }
}