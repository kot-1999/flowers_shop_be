import dayjs from 'dayjs'
import { AuthRequest, NextFunction, Response } from 'express'
import Joi from 'joi'

import prisma from '../../services/Prisma'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { slugify, translationSelect } from '../../utils/helpers'
import { IError } from '../../utils/IError'

export class ItemTypeController extends AbstractController {

    public static readonly schemas = {
        request: {
            getItemTypes: JoiCommon.object.request.keys({
                query: JoiCommon.object.paginatedQuery.keys({
                    search: Joi.string().allow('')
                        .optional(),
                    sort: Joi.string().valid('asc', 'desc')
                        .default('asc')
                }).required()
            }),

            putItemType: JoiCommon.object.request.keys({
                body: Joi.object({
                    itemTypeID: JoiCommon.string.id.optional(),
                    nameTID: JoiCommon.string.id.optional(),
                    nameTranslations: JoiCommon.object.translationsReq,
                    weight: Joi.number().min(1)
                        .description('Weight in gramms')
                        .required()
                }).or('nameTranslations', 'nameTID')
                    .required()
            }),

            deleteItemType: JoiCommon.object.request.keys({
                params: Joi.object({
                    itemTypeID: JoiCommon.string.id.required()
                }).required()
            })
        },

        response: {
            getItemTypes: Joi.object({
                itemTypes: Joi.array().items(Joi.object({
                    id: JoiCommon.string.id.required(),
                    name: JoiCommon.object.translationsRes,
                    weight: Joi.number().required(),
                    createdAt: Joi.date().iso()
                        .required(),
                    updatedAt: Joi.date().iso()
                        .required()
                }))
                    .required(),
                pagination: JoiCommon.object.paginationRes
            }),

            putItemType: Joi.object({
                itemType: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required(),
                message: Joi.string().required()
            }),

            deleteItemType: Joi.object({
                message: Joi.string().required()
            })
        }
    }

    constructor() {
        super()
    }

    private GetItemTypesReqType: Joi.extractType<typeof ItemTypeController.schemas.request.getItemTypes>
    private GetItemTypesResType: Joi.extractType<typeof ItemTypeController.schemas.response.getItemTypes>
    public async getItemTypes(
        req: AuthRequest & typeof this.GetItemTypesReqType,
        res: Response<typeof this.GetItemTypesResType>,
        next: NextFunction
    ) {
        try {
            const { query } = req
            const skip = (query.page - 1) * query.limit
            const language = req.headers['accept-language']

            const where: any = {
                deletedAt: null
            }
            
            if (query.search) {
                const terms = slugify(query.search).split('-')

                where.name = {
                    AND: terms.map((term: string) => ({
                        [`${language}Slug`]: {
                            contains: term
                        }
                    }))
                }
            }

            const [itemTypes, count] = await Promise.all([
                prisma.itemType.findMany({
                    select: {
                        id: true,
                        weight: true,
                        name: {
                            select: translationSelect
                        },
                        createdAt: true,
                        updatedAt: true
                    },
                    where,
                    take: query.limit,
                    skip,
                    orderBy: {
                        name: {
                            [language as string + 'Slug']: query.sort
                        }
                    }
                }),
                prisma.itemType.count({ where })
            ])

            return res.status(200).json({
                itemTypes,
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total: count
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private PutItemTypeReqType: Joi.extractType<typeof ItemTypeController.schemas.request.putItemType>
    private PutItemTypeResType: Joi.extractType<typeof ItemTypeController.schemas.response.putItemType>
    public async putItemType(
        req: AuthRequest & typeof this.PutItemTypeReqType,
        res: Response<typeof this.PutItemTypeResType>,
        next: NextFunction
    ) {
        try {

            const { body } = req
            const [itemType, nameTranslation] = await Promise.all([
                body.itemTypeID ? prisma.itemType.findFirst({
                    where: {
                        id: body.itemTypeID,
                        deletedAt: null
                    },
                    select: {
                        id: true,
                        nameTID: true
                    }
                }) : null,
                body.nameTID ? prisma.translation.findFirst({
                    where: { id: body.nameTID },
                    select: {
                        id: true
                    }
                }) : null
            ])

            if (body.itemTypeID && !itemType) {
                throw new IError(404, req.t('Item type not found'))
            }

            if (body.nameTID && !nameTranslation) {
                throw new IError(404, req.t('Name translations not found'))
            }

            let itemTypeResolved: { id: string, nameTID: string }
            const data: any = {
                weight: body.weight
            }

            if (body.nameTID) {
                data.name = { connect: { id: body.nameTID } }
            } else {
                data.name = {
                    create: body.nameTranslations
                }
            }

            if (body.itemTypeID) {
                itemTypeResolved = await prisma.itemType.update({
                    where: {
                        id: body.itemTypeID
                    },
                    data,
                    select: {
                        id: true,
                        nameTID: true
                    }
                })
            } else {
                itemTypeResolved = await prisma.itemType.create({
                    data,
                    select: {
                        id: true,
                        nameTID: true
                    }
                })
            }

            // Delete old translations
            itemType && itemTypeResolved.nameTID !== itemType.nameTID
                ? await prisma.translation.delete({ where: { id: itemType.nameTID } }) : null

            return res.status(200).json({
                itemType: {
                    id: itemTypeResolved.id
                },
                message: body.itemTypeID ? req.t('Item type updated') : req.t('New item type created')
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteItemTypeReqType: Joi.extractType<typeof ItemTypeController.schemas.request.deleteItemType>
    private DeleteItemTypeResType: Joi.extractType<typeof ItemTypeController.schemas.response.deleteItemType>
    public async deleteItemType(
        req: AuthRequest & typeof this.DeleteItemTypeReqType,
        res: Response<typeof this.DeleteItemTypeResType>,
        next: NextFunction
    ) {
        try {
            const { params } = req

            const [itemType, itemsNumInPricing] = await Promise.all([
                prisma.itemType.findFirst({
                    where: {
                        id: params.itemTypeID,
                        deletedAt: null
                    },
                    select: {
                        id: true
                    }
                }),
                await prisma.pricing.count({
                    where: {
                        itemTypeID: params.itemTypeID,
                        deletedAt: null
                    }
                })
            ])

            if (!itemType) {
                throw new IError(404, req.t('Category not found'))
            }

            if (itemsNumInPricing > 0) {
                throw new IError(403, req.t('Item type appears in {{count}} non-deleted pricing(s).', { count: itemsNumInPricing }))
            }

            await prisma.itemType.update({
                where: {
                    id: params.itemTypeID
                },
                data: {
                    deletedAt: dayjs().toISOString()
                }
            })

            return res.status(200).json({
                message: req.t('Item type was deleted')
            })
        } catch (err) {
            return next(err)
        }
    }
}