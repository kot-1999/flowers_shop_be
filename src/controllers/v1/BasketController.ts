import { GoodState } from '@prisma/client'
import { AuthRequest, NextFunction, Response, Request } from 'express'
import { TFunction } from 'i18next'
import Joi from 'joi'

import s3Service from '../../services/AwsS3'
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
            description: JoiCommon.object.singleTranslation.required(),
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
            getPublicBasketItems: JoiCommon.object.request.keys({
                body: Joi.object({
                    basketItems: Joi.array().items(Joi.object({
                        pricingID: Joi.string().required(),
                        goodID: Joi.string().required(),
                        quantity: Joi.number().integer()
                            .required(),
                        createdAt: Joi.date().iso()
                            .required()
                    }))
                        .required()
                }).required()
            }).required(),
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

                body: Joi.object({
                    basketItems: Joi.array().items(Joi.object({
                        basketItemID: JoiCommon.string.id,
                        quantity: Joi.number()
                            .integer()
                            .min(1)
                            .required()
                    }))
                        .min(1)
                        .required()
                }).required()
            }),

            deleteBasketItem: JoiCommon.object.request.keys({
                body: Joi.object({
                    basketItems: Joi.array().items(Joi.object({
                        id: JoiCommon.string.id 
                    }))
                        .min(1)
                        .required()
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
                basketItems: Joi.array().items(Joi.object({
                    id: JoiCommon.string.id.required()
                }).required())
                    .min(1)
                    .required(),

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
                photos: item.good.photos?.map((photoKey: string) => s3Service.getPublicUrl(photoKey)),
                selectionist: {
                    ...item.good.selectionist,
                    country: item.good.selectionist.country ? t(item.good.selectionist.country) : null
                }
            }
        }))
    }

    private GetPublicBasketItemsReqType: Joi.extractType<typeof BasketController.schemas.request.getPublicBasketItems>
    private GetBasketItemsResType: Joi.extractType<typeof BasketController.schemas.response.getBasketItems>
    public async getPublicBasketItems(
        req: Request & typeof this.GetPublicBasketItemsReqType,
        res: Response<typeof this.GetBasketItemsResType>,
        next: NextFunction
    ) {
        try {
            const language = req.headers['accept-language']
            const { basketItems } = req.body

            if (!basketItems.length) {
                return res.status(200).json({
                    basketItems: [],
                    unavailableBasketItems: [],
                    summary: {
                        totalPrice: 0,
                        totalAvailable: 0,
                        totalUnavailable: 0
                    }
                })
            }

            const pricings = await prisma.pricing.findMany({
                where: {
                    id: {
                        in: basketItems.map((item) => item.pricingID)
                    },
                    deletedAt: null,
                    goods: {
                        some: {
                            good: {
                                deletedAt: null,
                                state: {
                                    in: [GoodState.Available, GoodState.Awaiting]
                                }
                            }
                        }
                    }
                },
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
                    },
                    goods: {
                        select: {
                            good: {
                                select: {
                                    id: true,
                                    photos: true,
                                    state: true,
                                    name: {
                                        select: {
                                            [language as string]: true,
                                            [`${language}Slug`]: true
                                        }
                                    },
                                    description: {
                                        select: {
                                            [language as string]: true
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
                    }
                }
            })
            const mappedBasketItems: any[] = basketItems
                .map((item) => {
                    const pricing = pricings.find((pricing: any) => pricing.id === item.pricingID)
                    const good = pricing.goods.find((goodItem: any) => goodItem.good.id === item.goodID)

                    if (!pricing || !good) {
                        return null
                    }

                    return {
                        id: item.pricingID,
                        quantity: item.quantity,
                        createdAt: item.createdAt,
                        pricing: {
                            id: pricing.id,
                            price: pricing.price,
                            quantity: pricing.quantity,
                            itemType: pricing.itemType
                        },
                        good: good.good
                    }
                })
                .filter(Boolean)

            const unavailableBasketItems = mappedBasketItems.filter((item: any) =>
                item.pricing.quantity < 1 || item.good.state === GoodState.Awaiting)

            const availableBasketItems = mappedBasketItems.filter((item: any) =>
                item.pricing.quantity > 0 && item.good.state === GoodState.Available)

            let totalPrice = 0

            for (const item of availableBasketItems) {
                totalPrice += item.pricing.price * item.quantity
            }

            return res.status(200).json({
                basketItems: BasketController.mapBasketItems(
                    availableBasketItems,
                    req.t
                ),
                unavailableBasketItems: BasketController.mapBasketItems(
                    unavailableBasketItems,
                    req.t
                ),
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

    private GetBasketItemsReqType: Joi.extractType<typeof BasketController.schemas.request.getBasketItems>
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
                            description: {
                                select: {
                                    [language as string]: true
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
                message: req.t('Added to basket')
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
            const { body, user } = req

            const basketItems = await prisma.basketItem.findMany({
                where: {
                    id: {
                        in: body.basketItems.map((item) => item.basketItemID)
                    },
                    userID: user.id
                },
                select: {
                    id: true,
                    pricing: {
                        select: {
                            id: true,
                            quantity: true
                        }
                    }
                }
            })

            const updatedBasketItems = await prisma.$transaction(basketItems.map((item: any) => {
                const updateVal = body.basketItems.find((bi) => bi.basketItemID === item.id)
                if (!updateVal) {
                    return
                }
                return prisma.basketItem.update({
                    where: {
                        id: item.id
                    },
                    data: {
                        quantity: Math.min(
                                item.pricing.quantity!,
                                updateVal.quantity
                        )
                    },
                    select: {
                        id: true
                    }
                })
            }))

            return res.status(200).json({
                basketItems: updatedBasketItems,
                message: req.t('Items updated')
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
            const { body, user } = req

            const basketItems = await prisma.basketItem.findMany({
                where: {
                    id: {
                        in: body.basketItems.map((item) => item.id)
                    },
                    userID: user.id
                },
                select: {
                    id: true
                }
            })

            await prisma.basketItem.deleteMany({
                where: {
                    id: {
                        in: basketItems.map((item: { id: string }) => item.id)
                    }
                }
            })

            return res.status(200).json({
                message: req.t('{{count}} item(s) deleted', { count: basketItems.length })
            })
        } catch (err) {
            return next(err)
        }
    }
}