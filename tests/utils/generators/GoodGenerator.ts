import { faker } from '@faker-js/faker';
import { Category, Good, GoodState, ItemType, Selectionist, Translation } from '@prisma/client'
import { Tags } from '@sentry/node/build/types/integrations/tracing/hapi/types';
import dayjs from 'dayjs';

import CategoryGenerator from './CategoryGenerator';
import ItemTypeGenerator from './ItemTypeGenerator';
import SelectionistGenerator from './SelectionistGenerator';
import TagGenerator from './TagGenerator';
import prisma from '../../../src/services/Prisma';
import { Language, Languages } from '../../../src/utils/enums';
import LocalizedFaker from '../LocalizedFaker';

const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

const pickRandom = <T>(arr: T[], count: number) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
}

export class GoodGenerator {

    static async generateGood(data: Partial<Good> & {
        name?: Partial<Translation>,
        description?: Partial<Translation>
        category?: Partial<Category>
        selectionist?: Partial<Selectionist>
        tags?: Partial<Tags>[],
        itemTypes?: Partial<ItemType>[]
    } = {}) {
        const payload = await GoodGenerator.generateData(data);

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
                        pricing: {
                            create: {
                                price: p.price,
                                quantity: p.quantity,
                                itemType: {
                                    connect: { id: p.itemTypeID }
                                }
                            }
                        }
                    }))
                }
            }
        });
    }

    static async generateData(data: Partial<Good> & {
        name?: Partial<Translation>,
        description?: Partial<Translation>
        category?: Partial<Category>
        selectionist?: Partial<Selectionist>
        tags?: Partial<Tags>[],
        itemTypes?: Partial<ItemType>[]
    } = {}) {
        const id = data.id ?? faker.string.uuid()

        const category = data.category
            ?? await CategoryGenerator.generateCategory()

        const selectionist = data.selectionist
            ?? await SelectionistGenerator.generateSelectionist()

        const tags = data.tags
            ?? await Promise.all([TagGenerator.generateTag(), TagGenerator.generateTag(), TagGenerator.generateTag()])

        const itemTypes
            = data.itemTypes
            ?? await Promise.all([ItemTypeGenerator.generateItemType(), ItemTypeGenerator.generateItemType()])

        const pricingCount = Math.floor(Math.random() * 4) + 1;

        const pricings = Array.from({ length: pricingCount }).map(() => {
            const itemType = pickRandom(itemTypes, 1)[0]

            return {
                itemTypeID: itemType.id,
                price: Number((Math.random() * 50 + 5).toFixed(2)),
                quantity: rand(0, 20)
            }
        })

        const totalQty = pricings.reduce((s, p) => s + p.quantity, 0)

        const state
            = data?.state
            ?? (
                totalQty > 0
                    ? GoodState.Available
                    : data?.deletedAt
                        ? GoodState.Deleted
                        : GoodState.Awaiting
            );

        return {
            id,
            categoryID: category.id,
            selectionistID: selectionist.id,
            tagIDs: tags.map((tag: { id: string }) => tag.id),

            name: data.name ?? Object.fromEntries(Languages.map((lang: Language) => [
                lang,
                LocalizedFaker.safeCall(LocalizedFaker.get(lang).commerce.department)
            ])),

            description: data.description ?? Object.fromEntries(Languages.map((lang: Language) => [
                lang,
                LocalizedFaker.safeCall(LocalizedFaker.get(lang).commerce.productDescription)
            ])),

            photos: data.photos ?? [],
            state,
            pricings,
            createdAt: data.createdAt ?? dayjs().toISOString(),
            updatedAt: data.updatedAt ?? dayjs().toISOString(),
            deletedAt: data.deletedAt ?? null
        }
    }
}