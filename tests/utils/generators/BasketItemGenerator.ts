import { faker } from '@faker-js/faker'
import { BasketItem } from '@prisma/client'
import dayjs from 'dayjs'

import { GoodGenerator } from './GoodGenerator'
import UserGenerator from './UserGenerator'
import prisma from '../../../src/services/Prisma'

export default class BasketItemGenerator {

    public static async generateBasketItem(data: Partial<BasketItem> = {}) {
        const item = await this.generateData(data)

        return prisma.basketItem.create({
            data: item
        })
    }

    public static async generateData(data: Partial<BasketItem> = {}) {
        const userID
            = data.userID
            ?? (await UserGenerator.generateUser()).id

        let pricingID = data.pricingID

        if (!pricingID) {
            const good = await GoodGenerator.generateGood()

            const pricing = await prisma.pricing.findFirst({
                where: {
                    goodID: good.id
                }
            })
            pricingID = pricing.id
        }

        return {
            id: data.id ?? faker.string.uuid(),

            quantity: data.quantity
                ?? faker.number.int({
                    min: 1,
                    max: 10
                }),

            pricingID,
            userID,

            createdAt: data.createdAt ?? dayjs().toISOString()
        }
    }
}