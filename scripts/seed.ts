import fs from 'node:fs'
import path from 'node:path'

import { UserRole } from '@prisma/client'
import config from 'config'

import * as seedData from './seedData/seedData'
import s3Service from '../src/services/AwsS3'
import { EncryptionService } from '../src/services/Encryption'
import logger from '../src/services/Logger'
import prisma from '../src/services/Prisma'
import { IConfig } from '../src/types/config'
import CategoryGenerator from '../tests/utils/generators/CategoryGenerator'
import { GoodGenerator } from '../tests/utils/generators/GoodGenerator'
import ItemTypeGenerator from '../tests/utils/generators/ItemTypeGenerator'
import SelectionistGenerator from '../tests/utils/generators/SelectionistGenerator'
import TagGenerator from '../tests/utils/generators/TagGenerator'
import UserGenerator from '../tests/utils/generators/UserGenerator'

const seedConfig = config.get<IConfig['seed']>('seed')

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const pickRandom = (arr: any[], max: number, min: number = 0) => [...arr].sort(() => Math.random() - 0.5).slice(min, max)

const imagesDirs = [
    path.join(__dirname, 'seedData/photos/Violets'),
    path.join(__dirname, 'seedData/photos/Peonies'),
    path.join(__dirname, 'seedData/photos/Irises')
]

async function seed() {
    try {
   
        setTimeout(() => {}, 10000)

        const users: any[] = []
        const categories: any[] = []
        const itemTypes: any[] = []
        const selectionists: any[] = []
        const tags: any[] = []
        const goods: any[] = []
        const images: {
        [key: string]: string[]
    } = {
        [imagesDirs[0]]: [],
        [imagesDirs[1]]: [],
        [imagesDirs[2]]: []
    }

        if ((await prisma.good.count()) === 0) {
            for (const imgDir of imagesDirs) {
                for (const file of fs.readdirSync(imgDir)) {
                    const result = await s3Service.uploadFile(
                        path.join(imgDir, file),
                        'image'
                    )
                    images[imgDir].push(result.key)
                }
            }
        }

        // Generate plain objects
        for (let i = 0; i < seedConfig.grain; i++) {
            if (i % 3 === 0) {
                users.push(UserGenerator.generateData({
                    password: EncryptionService.hashSHA256('Test123'),
                    role: UserRole.Admin
                }))
            } else if (i % 2 === 0) {
                users.push(UserGenerator.generateData({
                    password: EncryptionService.hashSHA256('Test123'),
                    role: UserRole.User
                }))
            } else {
                users.push(UserGenerator.generateData({
                    role: UserRole.NotRegistered
                }))
            }
        }

        for (let i = 0; i < seedConfig.grain / 4; i++) {
            selectionists.push(SelectionistGenerator.generateData())
        }

        for (const category of seedData.categories) {
            categories.push(CategoryGenerator.generateData(category))
        }

        for (const itemType of seedData.itemTypes) {
            itemTypes.push(ItemTypeGenerator.generateData(itemType as any))
        }

        for (let i = 0; i < seedConfig.grain / 3; i++) {
            tags.push(TagGenerator.generateData())
        }

        let index = 0
        for (const category of categories) {
            const goodsCount = rand(
                Math.floor(seedConfig.grain / 4),
                seedConfig.grain
            )

            const categoryGoods = await Promise.all(Array.from({ length: goodsCount }, () =>
                GoodGenerator.generateData({
                    categoryID: category.id,
                    photos: pickRandom(images[imagesDirs[index]], 7, 1),
                    selectionistID: selectionists[Math.floor(Math.random() * selectionists.length)].id,

                    tagIDs: pickRandom(tags, rand(1, Math.min(3, tags.length))).map((t) => t.id),

                    itemTypeIDs: pickRandom(itemTypes, rand(1, Math.min(3, itemTypes.length))).map((i) => i.id)
                })))

            goods.push(...categoryGoods)
            index += 1
        }

        // Map all translations

        const translations: any[] = []
        const pricings: any[] = []
        const goodTags: any[] = []
        const goodPricings: any[] = []
    
        categories.forEach((item) => {
            translations.push(item.name)
            translations.push(item.description)
        })
        itemTypes.forEach((item) => translations.push(item.name))
        selectionists.forEach((item) => translations.push(item.name))
        tags.forEach((item) => translations.push(item.name))
        goods.forEach((item) => {
            translations.push(item.name)
            translations.push(item.description)
            item.pricings.forEach((pricing: any) => {
                pricings.push(pricing)
                goodPricings.push({
                    goodID: item.id,
                    pricingID: pricing.id
                })
            })
            item.tagIDs.forEach((tagID: string) => goodTags.push({
                tagID,
                goodID: item.id
            }))
        })
    
        const seededTables: string[] = []
    
        await prisma.$transaction(async (tx: any) => {
            const seededTables: string[] = []

            if ((await tx.translation.count()) === 0) {
                await tx.translation.createMany({
                    data: translations,
                    skipDuplicates: true
                })
                seededTables.push('translations')
            }

            if ((await tx.user.count()) === 0) {
                await tx.user.createMany({
                    data: users,
                    skipDuplicates: true
                })
                seededTables.push('users')
            }
            if ((await tx.category.count()) === 0) {
                await tx.category.createMany({
                    data: categories.map(({ name, description, ...rest }) => ({
                        ...rest,
                        nameTID: name.id,
                        descriptionTID: description.id
                    }))
                })

                seededTables.push('categories')
            }

            if ((await tx.itemType.count()) === 0) {
                await tx.itemType.createMany({
                    data: itemTypes.map(({ name, ...rest }) => ({
                        ...rest,
                        nameTID: name.id
                    }))
                })

                seededTables.push('itemTypes')
            }

            if ((await tx.selectionist.count()) === 0) {
                await tx.selectionist.createMany({
                    data: selectionists.map(({ name, ...rest }) => ({
                        ...rest,
                        nameTID: name.id
                    }))
                })

                seededTables.push('selectionists')
            }

            if ((await tx.tag.count()) === 0) {
                await tx.tag.createMany({
                    data: tags.map(({ name, ...rest }) => ({
                        ...rest,
                        nameTID: name.id
                    }))
                })

                seededTables.push('tags')
            }

            if ((await tx.pricing.count()) === 0) {
                await tx.pricing.createMany({
                    data: pricings.map((item) => ({
                        id: item.id,
                        price: item.price,
                        quantity: item.quantity,
                        itemTypeID: item.itemTypeID
                    }))
                })

                seededTables.push('pricings')
            }

            // throw new Error('TEST' + seededTables)

            if ((await tx.good.count()) === 0) {
                await tx.good.createMany({
                    data: goods.map((good) => ({
                        id: good.id,
                        state: good.state,
                        photos: good.photos,

                        nameTID: good.name.id,
                        descriptionTID: good.description.id,
                        categoryID: good.categoryID,
                        selectionistID: good.selectionistID,

                        createdAt: good.createdAt,
                        updatedAt: good.updatedAt,
                        deletedAt: good.deletedAt
                    }))
                })

                seededTables.push('goods')
            }

            if ((await tx.goodTag.count()) === 0) {
                await tx.goodTag.createMany({
                    data: goodTags
                })

                seededTables.push('goodTags')
            }

            if ((await tx.goodPricing.count()) === 0) {
                await tx.goodPricing.createMany({
                    data: goodPricings
                })

                seededTables.push('goodPricings')
            }

            logger.info(`Seeded tables: ${
                seededTables.length > 0 ? seededTables.join(', ') : 'none'
            }`)
        })
     
        logger.info(`Database was seeded with ${seededTables.length} table(s)${seededTables.length > 0 ? ': ' + seededTables.join(', ') : '.'}`)
    } catch (err: any) {
        // eslint disable-next-line
        console.log(err)
        throw err
    }
}

seed().catch((error) => {
    logger.error('Seeding failed:', error)
    process.exit(1)
})

export default seed