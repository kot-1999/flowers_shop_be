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

        let goodID = data.goodID
        let pricingID = data.pricingID

        if (!goodID || !pricingID) {
            const good = await GoodGenerator.generateGood()
            
            goodID = good.id
            pricingID = good.pricings[0].id
        }

        return {
            id: data.id ?? faker.string.uuid(),

            quantity: data.quantity
                ?? faker.number.int({
                    min: 1,
                    max: 10
                }),

            goodID,
            pricingID,
            userID,

            createdAt: data.createdAt ?? dayjs().toISOString()
        }
    }
}