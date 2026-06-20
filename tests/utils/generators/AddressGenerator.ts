import { faker } from '@faker-js/faker'
import { Address, Country } from '@prisma/client'
import dayjs from 'dayjs'

import prisma from '../../../src/services/Prisma'

export default class AddressGenerator {
    public static generateAddress(data: Partial<Address> = {}) {
        const item = this.generateData(data)

        return prisma.address.create({
            data: {
                ...item
            }
        })
    }

    public static generateData(data: Partial<Address> = {}) {
        return {
            id: faker.string.uuid(),

            apartment: data.apartment ?? faker.helpers.maybe(() => faker.string.alphanumeric(4), { probability: 0.3 }) ?? null,
            building: data.building ?? faker.number.int({
                min: 1,
                max: 200 
            }).toString(),
            street: data.street ?? faker.location.street(),
            city: data.city ?? faker.location.city(),
            postcode: data.postcode ?? faker.location.zipCode(),

            country: data.country ?? faker.helpers.arrayElement(Object.values(Country)),
            isDefault: data.isDefault ?? false,

            userID: data.userID ?? faker.string.uuid(),

            createdAt: data.createdAt ?? dayjs().toISOString(),
            updatedAt: data.updatedAt ?? dayjs().toISOString(),
            deletedAt: data.deletedAt ?? null
        }
    }
}