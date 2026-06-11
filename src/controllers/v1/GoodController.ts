import { GoodState } from '@prisma/client';
import dayjs from 'dayjs';
import { AuthRequest, NextFunction, Response } from 'express';
import Joi from 'joi';

import prisma from '../../services/Prisma';
import { AbstractController } from '../../types/AbstractController';
import { JoiCommon } from '../../types/JoiCommon';
import { slugify, translationSelect } from '../../utils/helpers';
import { IError } from '../../utils/IError'

const enum Action {
    Show = 'show',
    Hide = 'hide',
}

export class GoodController extends AbstractController {

    public static readonly schemas = {
        request: {
            getGoods: JoiCommon.object.request.keys({
                query: JoiCommon.object.paginatedQuery.keys({
                    categoryID: JoiCommon.string.id.optional(),
                    selectionistIDs: Joi.array().items(JoiCommon.string.id)
                        .optional(),
                    itemTypeIDs: Joi.array().items(JoiCommon.string.id)
                        .optional(),
                    tagIDs: Joi.array().items(JoiCommon.string.id)
                        .optional(),
                    state: Joi.array()
                        .items(Joi.string().valid(...Object.values(GoodState)))
                        .default([GoodState.Available, GoodState.NoShow]),
                    search: Joi.string()
                        .allow('')
                        .optional(),

                    sortBy: Joi.string().valid('createdAt', 'name', 'selectionist', 'state')
                        .default('createdAt'),
                    sortOrder: Joi.string()
                        .valid('asc', 'desc')
                        .default('desc')
                }).required()
            }),

            getGood: JoiCommon.object.request.keys({
                params: Joi.object({
                    goodID: JoiCommon.string.id
                }).required()
            }),

            postGood: JoiCommon.object.request.keys({
                body: Joi.object({
                    categoryID: JoiCommon.string.id,
                    selectionistID: JoiCommon.string.id,

                    tagIDs: Joi.array().items(JoiCommon.string.id)
                        .unique()
                        .min(1)
                        .max(10)
                        .required(),

                    nameTranslations: JoiCommon.object.translations.required(),

                    descriptionTranslations: JoiCommon.object.translations.required(),

                    action: Joi.string().valid(Action.Show, Action.Hide)
                        .optional()
                        .default(Action.Show),

                    photos: Joi.array().items(Joi.string())
                        .max(5)
                        .unique()
                        .required(),

                    pricings: Joi.array().items(Joi.object({
                        itemTypeID: JoiCommon.string.id,

                        price: Joi.number()
                            .precision(2)
                            .min(0.01)
                            .required(),

                        quantity: Joi.number()
                            .integer()
                            .min(0)
                            .required()
                    }))
                        .min(1)
                        .required()
                })
                    .required()
            }),

            patchGood: JoiCommon.object.request.keys({
                params: Joi.object({
                    goodID: JoiCommon.string.id
                }).required(),

                body: Joi.object({
                    categoryID: JoiCommon.string.id.optional(),
                    selectionistID: JoiCommon.string.id.optional(),

                    tagIDs: Joi.array().items(JoiCommon.string.id)
                        .unique()
                        .min(1)
                        .max(10)
                        .optional(),

                    nameTranslations: JoiCommon.object.translations.optional(),

                    descriptionTranslations: JoiCommon.object.translations.optional(),

                    action: Joi.string().valid(Action.Show, Action.Hide)
                        .optional(),

                    photos: Joi.array().items(Joi.string())
                        .max(5)
                        .unique()
                        .optional(),

                    pricings: Joi.array().items(Joi.object({
                        pricingID: JoiCommon.string.id.optional(),
                        itemTypeID: JoiCommon.string.id,

                        price: Joi.number()
                            .precision(2)
                            .min(0.01)
                            .required(),

                        quantity: Joi.number()
                            .integer()
                            .min(0)
                            .required()
                    }))
                        .min(1)
                        .optional()
                }).min(1)
                    .required()
            }),

            deleteGood: JoiCommon.object.request.keys({
                params: Joi.object({
                    goodID: JoiCommon.string.id
                }).required()
            })
        },

        response: {
            getGoods: Joi.object({
                goods: Joi.array().items(Joi.object({
                    id: JoiCommon.string.id,

                    photos: Joi.array().items(Joi.string())
                        .required(),

                    name: JoiCommon.object.singleTranslation.required(),
                    description: JoiCommon.object.singleTranslation.required(),

                    state: Joi.string().valid(...Object.values(GoodState))
                        .required(),

                    createdAt: Joi.date().iso()
                        .required(),
                    updatedAt: Joi.date().iso()
                        .required(),

                    tags: Joi.array().items(Joi.object({
                        id: JoiCommon.string.id,
                        name: JoiCommon.object.singleTranslation
                    }))
                        .min(1)
                        .max(10)
                        .required(),

                    selectionist: Joi.object({
                        id: JoiCommon.string.id,
                        name: JoiCommon.object.singleTranslation.required(),
                        country: Joi.string().allow(null)
                            .required()
                    }).required(),

                    pricings: Joi.array().items(Joi.object({
                        id: JoiCommon.string.id,
                        price: Joi.number()
                            .precision(2)
                            .min(0.01)
                            .required(),

                        quantity: Joi.number()
                            .integer()
                            .min(0)
                            .required(),
                        itemType: Joi.object({
                            id: JoiCommon.string.id,
                            name: JoiCommon.object.singleTranslation.required()
                        }).required()
                    }))
                        .min(1)
                        .required()

                }))
                    .required(),

                pagination: JoiCommon.object.paginationRes.required()
            }),

            getGood: Joi.object({
                good: Joi.object({
                    id: JoiCommon.string.id,
                    photos: Joi.array().items(Joi.string())
                        .required(),
                    category: Joi.object({
                        id: JoiCommon.string.id,
                        name: JoiCommon.object.singleTranslation.required()
                    }),
                    selectionist: Joi.object({
                        id: JoiCommon.string.id,
                        name: JoiCommon.object.singleTranslation.required(),
                        country: Joi.string().allow(null)
                            .required()
                    }).required(),

                    name: JoiCommon.object.translations.required(),
                    description: JoiCommon.object.translations.required(),

                    state: Joi.string().valid(...Object.values(GoodState))
                        .required(),

                    tags: Joi.array().items(Joi.object({
                        id: JoiCommon.string.id,
                        name: JoiCommon.object.translations.required()
                    }))
                        .required(),

                    createdAt: Joi.date().iso()
                        .required(),
                    updatedAt: Joi.date().iso()
                        .required(),

                    pricings: Joi.array().items(Joi.object({
                        id: JoiCommon.string.id.required(),

                        itemType: Joi.object({
                            id: JoiCommon.string.id,
                            name: JoiCommon.object.singleTranslation.required()
                        }).required(),

                        quantity: Joi.number()
                            .integer()
                            .min(0)
                            .required(),
                        price: Joi.number().required()
                    }))
                        .min(1)
                        .required()
                }).required()
            }),

            postGood: Joi.object({
                good: Joi.object({
                    id: JoiCommon.string.id
                }).required(),
                message: Joi.string().required()
            }),

            patchGood: Joi.object({
                good: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required(),
                message: Joi.string().required()
            }),

            deleteGood: Joi.object({
                message: Joi.string().required()
            })
        }
    }
    private GetGoodsReqType: Joi.extractType<typeof GoodController.schemas.request.getGoods>
    private GetGoodsResType: Joi.extractType<typeof GoodController.schemas.response.getGoods>
    public async getGoods(
        req: AuthRequest & typeof this.GetGoodsReqType,
        res: Response<typeof this.GetGoodsResType>,
        next: NextFunction
    ) {
        try {
            const { query } = req
            const skip = (query.page - 1) * query.limit
            const language = req.headers['accept-language'] as string

            const where: any = {
                deletedAt: null
            }

            if (query.categoryID) {
                where.categoryID = query.categoryID
            }

            if (query.selectionistIDs?.length) {
                where.selectionistID = {
                    in: query.selectionistIDs
                }
            }

            if (query.state?.length) {
                where.state = {
                    in: query.state
                }
            }

            if (query.tagIDs?.length) {
                where.tags = {
                    some: {
                        tagID: {
                            in: query.tagIDs
                        }
                    }
                }
            }

            if (query.search) {
                const terms = slugify(query.search).split('-')
                    .filter(Boolean)

                where.name = {
                    AND: terms.map((term) => ({
                        [`${language}Slug`]: {
                            contains: term
                        }
                    }))
                }
            }

            const orderBy: any = {}

            if (query.sortBy === 'name') {
                orderBy.name = {
                    [`${language}Slug`]: query.sortOrder
                }
            } else if (query.sortBy === 'selectionist') {
                orderBy.selectionist = {
                    name: {
                        [`${language}Slug`]: query.sortOrder
                    }
                }
            } else {
                orderBy[query.sortBy] = query.sortOrder
            }

            const [goods, count] = await Promise.all([
                prisma.good.findMany({
                    where,
                    skip,
                    take: query.limit,
                    orderBy,
                    select: {
                        id: true,
                        photos: true,
                        state: true,
                        createdAt: true,
                        updatedAt: true,

                        name: {
                            select: {
                                [language]: true
                            }
                        },

                        description: {
                            select: {
                                [language]: true
                            }
                        },

                        tags: {
                            select: {
                                tag: {
                                    select: {
                                        id: true,
                                        name: {
                                            select: {
                                                [language]: true
                                            }
                                        }
                                    }
                                }
                            }
                        },

                        selectionist: {
                            select: {
                                id: true,
                                name: {
                                    select: {
                                        [language]: true
                                    }
                                },
                                country: true
                            }
                        },

                        pricings: {
                            select: {
                                pricing: {
                                    select: {
                                        id: true,
                                        price: true,
                                        quantity: true,
                                        itemType: {
                                            select: {
                                                id: true,
                                                name: {
                                                    select: {
                                                        [language]: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }),

                prisma.good.count({ where })
            ])

            return res.status(200).json({
                goods: goods.map((good: any) => ({
                    ...good,
                    tags: good.tags.map((item: any) => ({ ...item.tag })),
                    pricings: good.pricings.map((item: any) => ({ ...item.pricing }))
                })),
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

    private GetGoodReqType: Joi.extractType<typeof GoodController.schemas.request.getGood>
    private GetGoodResType: Joi.extractType<typeof GoodController.schemas.response.getGood>
    public async getGood(
        req: AuthRequest & typeof this.GetGoodReqType,
        res: Response<typeof this.GetGoodResType>,
        next: NextFunction
    ) {
        try {
            const { params } = req
            const language = req.headers['accept-language'] as string

            const good = await prisma.good.findFirst({
                where: {
                    id: params.goodID,
                    deletedAt: null
                },
                select: {
                    id: true,
                    photos: true,
                    state: true,
                    createdAt: true,
                    updatedAt: true,

                    name: {
                        select: translationSelect
                    },

                    description: {
                        select: translationSelect
                    },

                    tags: {
                        select: {
                            tag: {
                                select: {
                                    id: true,
                                    name: {
                                        select: translationSelect
                                    }
                                }
                            }
                        }
                    },

                    selectionist: {
                        select: {
                            id: true,
                            name: {
                                select: translationSelect
                            },
                            country: true
                        }
                    },

                    pricings: {
                        select: {
                            pricing: {
                                select: {
                                    id: true,
                                    price: true,
                                    quantity: true,
                                    itemType: {
                                        select: {
                                            id: true,
                                            name: {
                                                select: {
                                                    [language]: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

            if (!good) {
                throw new IError(404, req.t('Good not found'))
            }

            return res.status(200).json({
                good: {
                    ...good,
                    tags: good.tags.map((item: any) => ({ ...item.tag })),
                    pricings: good.pricings.map((item: any) => ({ ...item.pricing }))
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private PostGoodReqType: Joi.extractType<typeof GoodController.schemas.request.postGood>
    private PostGoodResType: Joi.extractType<typeof GoodController.schemas.response.postGood>

    public async postGood(
        req: AuthRequest & typeof this.PostGoodReqType,
        res: Response<typeof this.PostGoodResType>,
        next: NextFunction
    ) {
        try {
            const { body } = req

            const [
                category,
                selectionist,
                tags,
                itemTypes
            ] = await Promise.all([
                prisma.category.findFirst({
                    where: {
                        id: body.categoryID,
                        deletedAt: null
                    },
                    select: {
                        id: true
                    }
                }),

                prisma.selectionist.findFirst({
                    where: {
                        id: body.selectionistID,
                        deletedAt: null
                    },
                    select: {
                        id: true
                    }
                }),

                prisma.tag.findMany({
                    where: {
                        id: {
                            in: body.tagIDs
                        },
                        deletedAt: null
                    },
                    select: {
                        id: true
                    }
                }),

                prisma.itemType.findMany({
                    where: {
                        id: {
                            in: body.pricings.map((p) => p.itemTypeID)
                        },
                        deletedAt: null
                    },
                    select: {
                        id: true
                    }
                })
            ])

            if (!category) {
                throw new IError(404, req.t('Category not found'))
            }

            if (!selectionist) {
                throw new IError(404, req.t('Selectionist not found'))
            }

            if (tags.length !== body.tagIDs.length) {
                throw new IError(404, req.t('One or more tags not found'))
            }

            if (itemTypes.length !== body.pricings.length) {
                throw new IError(404, req.t('One or more item types not found'))
            }

            const totalQuantity = body.pricings.reduce(
                (sum, pricing) => sum + pricing.quantity,
                0
            )

            const state = body.action === Action.Hide
                ? GoodState.NoShow
                : totalQuantity > 0
                    ? GoodState.Available
                    : GoodState.Awaiting

            const good = await prisma.good.create({
                data: {
                    state,

                    photos: body.photos,

                    category: {
                        connect: {
                            id: body.categoryID
                        }
                    },

                    selectionist: {
                        connect: {
                            id: body.selectionistID
                        }
                    },

                    tags: {
                        create: body.tagIDs.map((tagID: string) => ({
                            tag: {
                                connect: {
                                    id: tagID
                                }
                            }
                        }))
                    },

                    name: {
                        create: body.nameTranslations
                    },

                    description: {
                        create: body.descriptionTranslations
                    },

                    pricings: {
                        create: body.pricings.map((pricing) => ({
                            pricing: {
                                create: {
                                    price: pricing.price,
                                    quantity: pricing.quantity,
                                    itemType: {
                                        connect: { id: pricing.itemTypeID }
                                    }
                                }
                            }
                        }))
                    }
                },

                select: {
                    id: true
                }
            })

            return res.status(200).json({
                good: {
                    id: good.id
                },
                message: req.t('Good created')
            })
        } catch (err) {
            return next(err)
        }
    }

    private PatchGoodReqType: Joi.extractType<typeof GoodController.schemas.request.patchGood>
    private PatchGoodResType: Joi.extractType<typeof GoodController.schemas.response.patchGood>

    public async patchGood(
        req: AuthRequest & typeof this.PatchGoodReqType,
        res: Response<typeof this.PatchGoodResType>,
        next: NextFunction
    ) {
        try {
            const { body, params } = req

            const existingPricings = body.pricings?.filter((p) => p.pricingID) ?? [];
            const newPricings = body.pricings?.filter((p) => !p.pricingID) ?? [];

            const good = await prisma.good.findFirst({
                where: {
                    id: params.goodID
                },
                select: {
                    id: true,
                    state: true
                }
            })

            if (!good) {
                throw new IError(404, req.t('Good not found'))
            }

            const [
                category,
                selectionist,
                tags,
                itemTypes
            ] = await Promise.all([
                body.categoryID
                    ? prisma.category.findFirst({
                        where: {
                            id: body.categoryID,
                            deletedAt: null
                        },
                        select: { id: true }
                    })
                    : null,

                body.selectionistID
                    ? prisma.selectionist.findFirst({
                        where: {
                            id: body.selectionistID,
                            deletedAt: null
                        },
                        select: { id: true }
                    })
                    : null,

                body.tagIDs
                    ? prisma.tag.findMany({
                        where: {
                            id: { in: body.tagIDs },
                            deletedAt: null
                        },
                        select: { id: true }
                    })
                    : null,

                body.pricings
                    ? prisma.itemType.findMany({
                        where: {
                            id: { in: body.pricings.map((p) => p.itemTypeID) },
                            deletedAt: null
                        },
                        select: { id: true }
                    })
                    : null
            ])

            if (body.categoryID && !category) {
                throw new IError(404, req.t('Category not found'))
            }

            if (body.selectionistID && !selectionist) {
                throw new IError(404, req.t('Selectionist not found'))
            }

            if (body.tagIDs && tags!.length !== body.tagIDs.length) {
                throw new IError(404, req.t('One or more tags not found'))
            }

            if (body.pricings && itemTypes!.length !== body.pricings.length) {
                throw new IError(404, req.t('One or more item types not found'))
            }

            const updateData: any = {}

            if (body.categoryID) {
                updateData.category = {
                    connect: { id: body.categoryID }
                }
            }

            if (body.selectionistID) {
                updateData.selectionist = {
                    connect: { id: body.selectionistID }
                }
            }

            if (body.tagIDs) {
                updateData.tags = {
                    deleteMany: {},
                    create: body.tagIDs.map((tagID) => ({
                        tag: { connect: { id: tagID } }
                    }))
                }
            }

            if (body.nameTranslations) {
                updateData.name = {
                    update: body.nameTranslations
                }
            }

            if (body.descriptionTranslations) {
                updateData.description = {
                    update: body.descriptionTranslations
                }
            }

            if (body.photos) {
                updateData.photos = body.photos
            }

            if (body.action) {
                updateData.state
                    = body.action === Action.Hide
                        ? GoodState.NoShow
                        : good.state
            }

            if (newPricings) {
                updateData.pricings = {
                    create: newPricings.map((p) => ({
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

            const [updated] = await prisma.$transaction([
                prisma.good.update({
                    where: {
                        id: params.goodID
                    },
                    data: {
                        ...updateData,
                        pricings: {
                            create: newPricings.map((p) => ({
                                pricing: {
                                    create: {
                                        price: p.price,
                                        quantity: p.quantity,
                                        itemType: {
                                            connect: {
                                                id: p.itemTypeID
                                            }
                                        }
                                    }
                                }
                            }))
                        }
                    },
                    select: {
                        id: true
                    }
                }),

                ...existingPricings.map((existingPricing) =>
                    prisma.pricing.update({
                        where: {
                            id: existingPricing.pricingID
                        },
                        data: {
                            price: existingPricing.price,
                            quantity: existingPricing.quantity,
                            itemType: {
                                connect: {
                                    id: existingPricing.itemTypeID
                                }
                            }
                        }
                    }))
            ]);

            return res.status(200).json({
                good: { id: updated.id },
                message: req.t('Good updated')
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteGoodReqType: Joi.extractType<typeof GoodController.schemas.request.deleteGood>
    private DeleteGoodResType: Joi.extractType<typeof GoodController.schemas.response.deleteGood>
    public async deleteGood(
        req: AuthRequest & typeof this.DeleteGoodReqType,
        res: Response<typeof this.DeleteGoodResType>,
        next: NextFunction
    ) {
        try {
            const { params } = req

            const good = await prisma.good.findFirst({
                where: {
                    id: params.goodID
                },
                select: {
                    id: true
                }
            })

            if (!good) {
                throw new IError(404, req.t('Good not found'))
            }

            await prisma.good.update({
                where: {
                    id: params.goodID
                },
                data: {
                    deletedAt: dayjs().toISOString(),
                    state: GoodState.Deleted
                }
            })

            return res.status(200).json({
                message: req.t('Good deleted')
            })
        } catch (err) {
            return next(err)
        }
    }
}