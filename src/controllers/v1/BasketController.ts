import { GoodState } from '@prisma/client'
import { AuthRequest, NextFunction, Response } from 'express'
import { TFunction } from 'i18next'
import Joi from 'joi'

import prisma from '../../services/Prisma'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { IError } from '../../utils/IError'

export class BasketController extends AbstractController {
    public static basketItemSchema = Joi.object({
        id: JoiCommon.string.id.required(),

        quantity: Joi.number()
            .integer()
            .required(),
        createdAt: Joi.date()
            .iso()
            .required(),
        good: Joi.object({
            id: JoiCommon.string.id,
            name: JoiCommon.object.singleTranslationWithSlug.required(),
            photos: Joi.array().items(Joi.string())
                .required(),
            state: Joi.string().valid(...Object.values(GoodState))
                .required(),
            selectionist: Joi.object({
                id: JoiCommon.string.id,
                name: JoiCommon.object.singleTranslation.required(),
                country: Joi.string().required()
                    .allow(null)
            })
        }).required(),
        pricing: Joi.object({
            id: JoiCommon.string.id,
            quantity: Joi.number().integer()
                .min(0)
                .required(),
            price: Joi.number().required(),
            itemType: Joi.object({
                id: JoiCommon.string.id,
                name: JoiCommon.object.singleTranslation.required()
            }).required()
        })
    })
    
    public static readonly schemas = {
        request: {
            getBasketItems: JoiCommon.object.request.required(),

            postBasketItem: JoiCommon.object.request.keys({
                body: Joi.object({
                    goodID: JoiCommon.string.id.required(),

                    pricingID: JoiCommon.string.id.required(),

                    quantity: Joi.number()
                        .integer()
                        .min(1)
                        .required()
                }).required()
            }),

            patchBasketItem: JoiCommon.object.request.keys({
                params: Joi.object({
                    basketItemID: JoiCommon.string.id.required()
                }).required(),

                body: Joi.object({
                    quantity: Joi.number()
                        .integer()
                        .min(1)
                        .required()
                }).required()
            }),

            deleteBasketItem: JoiCommon.object.request.keys({
                params: Joi.object({
                    basketItemID: JoiCommon.string.id.required()
                }).required()
            })
        },

        response: {
            getBasketItems: Joi.object({
                basketItems: Joi.array()
                    .items(BasketController.basketItemSchema)
                    .required(),
                unavailableBasketItems: Joi.array()
                    .items(BasketController.basketItemSchema)
                    .required(),
                summary: Joi.object({
                    totalPrice: Joi.number().required(),
                    totalAvailable: Joi.number().required(),
                    totalUnavailable: Joi.number().required()
                })
            }),

            postBasketItem: Joi.object({
                basketItem: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required(),

                message: Joi.string().required()
            }),

            patchBasketItem: Joi.object({
                basketItem: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required(),

                message: Joi.string().required()
            }),

            deleteBasketItem: Joi.object({
                message: Joi.string().required()
            })
        }
    }

    constructor() {
        super()
    }
    
    private static mapBasketItems = (items: any[], t: TFunction) => {
        return items.map((item: any) => ({
            ...item,
            quantity: item.quantity > item.pricing.quantity ? item.pricing.quantity : item.quantity,
            good: {
                ...item.good,
                selectionist: {
                    ...item.good.selectionist,
                    country: item.good.selectionist.country ? t(item.good.selectionist.country) : null
                }
            }
        }))
    }

    private GetBasketItemsReqType: Joi.extractType<typeof BasketController.schemas.request.getBasketItems>
    private GetBasketItemsResType: Joi.extractType<typeof BasketController.schemas.response.getBasketItems>
    public async getBasketItems(
        req: AuthRequest & typeof this.GetBasketItemsReqType,
        res: Response<typeof this.GetBasketItemsResType>,
        next: NextFunction
    ) {
        try {
            const { user } = req
            const language = req.headers['accept-language']
            const basketItems = await prisma.basketItem.findMany({
                where: {
                    userID: user.id,
                    pricing: {
                        deletedAt: null
                    },
                    good: {
                        deletedAt: null,
                        state: {
                            in: ['Available', 'Awaiting']
                        }
                    }
                },
                orderBy: [
                    {
                        good: {
                            state: 'asc' // assumes Awaiting is last enum value OR adjust logic below
                        }
                    },
                    {
                        createdAt: 'desc'
                    }
                ],
                select: {
                    id: true,
                    quantity: true,
                    createdAt: true,

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
                                            [language as string]: true
                                        }
                                    }
                                }
                            }
                        }
                    },

                    good: {
                        select: {
                            id: true,
                            photos: true,
                            state: true,
                            name: {
                                select: {
                                    [language as string]: true,
                                    [language + 'Slug' as string]: true
                                }
                            },
                            selectionist: {
                                select: {
                                    id: true,
                                    name: {
                                        select: {
                                            [language as string]: true
                                        }
                                    },
                                    country: true
                                }
                            }
                        }
                    }
                }
            })
            
            const unavailableBasketItems = basketItems.filter((item: any) => item.pricing.quantity < 1 || item.good.state === GoodState.Awaiting)
            const availableBasketItems = basketItems.filter((item: any) => item.pricing.quantity > 0 && item.good.state === GoodState.Available)

            let totalPrice = 0

            for (const item of availableBasketItems) {
                totalPrice += item.pricing.price * item.quantity
            }

            return res.status(200).json({
                basketItems: BasketController.mapBasketItems(availableBasketItems, req.t),
                unavailableBasketItems: BasketController.mapBasketItems(unavailableBasketItems, req.t),
                summary: {
                    totalPrice: Number(totalPrice.toFixed(2)),
                    totalAvailable: availableBasketItems.length,
                    totalUnavailable: unavailableBasketItems.length
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private PostBasketItemReqType: Joi.extractType<typeof BasketController.schemas.request.postBasketItem>
    private PostBasketItemResType: Joi.extractType<typeof BasketController.schemas.response.postBasketItem>
    public async postBasketItem(
        req: AuthRequest & typeof this.PostBasketItemReqType,
        res: Response<typeof this.PostBasketItemResType>,
        next: NextFunction
    ) {
        try {
            const { body, user } = req

            const pricing = await prisma.pricing.findFirst({
                where: {
                    id: body.pricingID,
                    deletedAt: null
                },
                select: {
                    id: true,
                    quantity: true
                }
            })

            if (!pricing) {
                throw new IError(404, req.t('Pricing not found'))
            }

            const quantity = Math.min(
                body.quantity,
                pricing.quantity
            )

            const existingItem = await prisma.basketItem.findUnique({
                where: {
                    goodID_userID_pricingID: {
                        goodID: body.goodID,
                        pricingID: body.pricingID,
                        userID: user.id
                    }
                }
            })

            let basketItem

            if (existingItem) {
                basketItem = await prisma.basketItem.update({
                    where: {
                        id: existingItem.id
                    },
                    data: {
                        quantity: Math.min(existingItem.quantity + quantity, pricing.quantity)
                    },
                    select: {
                        id: true
                    }
                })
            } else {
                basketItem = await prisma.basketItem.create({
                    data: {
                        goodID: body.goodID,
                        pricingID: body.pricingID,
                        userID: user.id,
                        quantity
                    },
                    select: {
                        id: true
                    }
                })
            }

            return res.status(200).json({
                basketItem,
                message: req.t('Basket item created')
            })
        } catch (err) {
            return next(err)
        }
    }

    private PatchBasketItemReqType: Joi.extractType<typeof BasketController.schemas.request.patchBasketItem>
    private PatchBasketItemResType: Joi.extractType<typeof BasketController.schemas.response.patchBasketItem>
    public async patchBasketItem(
        req: AuthRequest & typeof this.PatchBasketItemReqType,
        res: Response<typeof this.PatchBasketItemResType>,
        next: NextFunction
    ) {
        try {
            const { params, body, user } = req

            const basketItem = await prisma.basketItem.findFirst({
                where: {
                    id: params.basketItemID,
                    userID: user.id
                },
                select: {
                    id: true,
                    pricingID: true
                }
            })

            if (!basketItem) {
                throw new IError(404, req.t('Basket item not found'))
            }

            const pricing = await prisma.pricing.findFirst({
                where: {
                    id: basketItem.pricingID,
                    deletedAt: null
                },
                select: {
                    quantity: true
                }
            })

            if (!pricing) {
                throw new IError(404, req.t('Pricing not found'))
            }

            const updated = await prisma.basketItem.update({
                where: {
                    id: basketItem.id
                },
                data: {
                    quantity: Math.min(
                        body.quantity,
                        pricing.quantity
                    )
                },
                select: {
                    id: true
                }
            })

            return res.status(200).json({
                basketItem: updated,
                message: req.t('Basket item updated')
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteBasketItemReqType: Joi.extractType<typeof BasketController.schemas.request.deleteBasketItem>
    private DeleteBasketItemResType: Joi.extractType<typeof BasketController.schemas.response.deleteBasketItem>
    public async deleteBasketItem(
        req: AuthRequest & typeof this.DeleteBasketItemReqType,
        res: Response<typeof this.DeleteBasketItemResType>,
        next: NextFunction
    ) {
        try {
            const { params, user } = req

            const basketItem = await prisma.basketItem.findFirst({
                where: {
                    id: params.basketItemID,
                    userID: user.id
                },
                select: {
                    id: true
                }
            })

            if (!basketItem) {
                throw new IError(404, req.t('Basket item not found'))
            }

            await prisma.basketItem.delete({
                where: {
                    id: basketItem.id
                }
            })

            return res.status(200).json({
                message: req.t('Basket item deleted')
            })
        } catch (err) {
            return next(err)
        }
    }
}