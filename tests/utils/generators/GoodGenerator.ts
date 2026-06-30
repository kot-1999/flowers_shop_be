import { faker } from '@faker-js/faker'
import { Good, GoodState, Translation } from '@prisma/client'
import dayjs from 'dayjs'

import CategoryGenerator from './CategoryGenerator'
import ItemTypeGenerator from './ItemTypeGenerator'
import SelectionistGenerator from './SelectionistGenerator'
import TagGenerator from './TagGenerator'
import prisma from '../../../src/services/Prisma'
import { Language, Languages } from '../../../src/utils/enums'
import LocalizedFaker from '../LocalizedFaker'

const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

export class GoodGenerator {

    static async generateGood(data: Partial<Good> & {
        name?: Partial<Translation>,
        description?: Partial<Translation>,
        itemTypeIDs?: string[],
        tagIDs?: string[]
    } = {}) {

        const payload = await GoodGenerator.generateData(data)

        return prisma.good.create({
            data: {
                id: payload.id,
                state: payload.state,
                photos: payload.photos,

                category: {
                    connect: { id: payload.categoryID }
                },

                selectionist: {
                    connect: { id: payload.selectionistID }
                },

                tags: {
                    create: payload.tagIDs.map((tagID) => ({
                        tag: {
                            connect: { id: tagID }
                        }
                    }))
                },

                name: {
                    create: payload.name
                },

                description: {
                    create: payload.description
                },

                pricings: {
                    create: payload.pricings.map((p) => ({
                        price: p.price,
                        quantity: p.quantity,
                        itemType: {
                            connect: { id: p.itemTypeID }
                        }
                    }))
                }
            }
        })
    }

    static async generateData(data: Partial<Good> & {
        name?: Partial<Translation>,
        description?: Partial<Translation>,
        itemTypeIDs?: string[],
        tagIDs?: string[]
    } = {}) {

        const id = data.id ?? faker.string.uuid()

        const categoryID
            = data.categoryID
            ?? (await CategoryGenerator.generateCategory()).id

        const selectionistID
            = data.selectionistID
            ?? (await SelectionistGenerator.generateSelectionist()).id

        const tagIDs
            = data.tagIDs
            ?? (await Promise.all(Array.from({ length: 3 }, () => TagGenerator.generateTag()))).map((t) => t.id)

        const itemTypeIDs
            = data.itemTypeIDs
            ?? (await Promise.all(Array.from({ length: 2 }, () => ItemTypeGenerator.generateItemType()))).map((i) => i.id)

        const pricings = itemTypeIDs.map((itemTypeID) => ({
            itemTypeID,
            id: faker.string.uuid(),
            price: Number((Math.random() * 50 + 5).toFixed(2)),
            quantity: rand(0, 20),
            goodID: id
        }))
        const totalQty = pricings.reduce((s, p) => s + p.quantity, 0)

        const state
            = data.state
            ?? (totalQty > 0
                ? GoodState.Available
                : data.deletedAt
                    ? GoodState.Deleted
                    : GoodState.Awaiting)

        return {
            id,
            categoryID,
            selectionistID,
            tagIDs,
            itemTypeIDs,
            pricings,

            name: data.name ?? {
                id: faker.string.uuid(),
                ...Object.fromEntries(Languages.map((lang: Language) => [
                    lang,
                    LocalizedFaker.safeCall(LocalizedFaker.get(lang).commerce.department)
                ]))
            },

            description: data.description ?? {
                id: faker.string.uuid(),
                ...Object.fromEntries(Languages.map((lang: Language) => [
                    lang,
                    LocalizedFaker.safeCall(LocalizedFaker.get(lang).commerce.productDescription)
                ]))
            },

            photos: data.photos ?? [],
            state,
            createdAt: data.createdAt ?? dayjs().toISOString(),
            updatedAt: data.updatedAt ?? dayjs().toISOString(),
            deletedAt: data.deletedAt ?? null
        }
    }
}