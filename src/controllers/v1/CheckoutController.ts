import { randomUUID } from 'crypto'

import { OrderState, UserRole } from '@prisma/client'
import dayjs from 'dayjs'
import { AuthRequest, NextFunction, Request, Response } from 'express'
import Joi from 'joi'

import { BasketController } from './BasketController'
import { EncryptionService } from '../../services/Encryption'
import { JwtService } from '../../services/Jwt'
import prisma from '../../services/Prisma'
import shippingService from '../../services/ShippingService'
import stripeService from '../../services/StripeService'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { JwtAudience, Language } from '../../utils/enums'
import { IError } from '../../utils/IError'

export class CheckoutController extends AbstractController {
    public static readonly schemas = {
        request: {
            createOrder: JoiCommon.object.request.keys({
                body: Joi.object({
                    addressID: Joi.string().uuid()
                        .required(),
                    shippingRateID: Joi.string().required(),
                    recipientFirstName: JoiCommon.string.name.required(),
                    recipientLastName: JoiCommon.string.name.required(),
                    recipientEmail: Joi.string().email()
                        .required(),
                    basketItems: Joi.array().items(Joi.object({
                        pricingID: Joi.string().required(),
                        quantity: Joi.number().integer()
                            .required(),
                        createdAt: Joi.date().iso()
                            .required()
                    }))
                        .optional()
                }).required()
            }),
            saveUser: JoiCommon.object.request.keys({
                body: Joi.object({
                    user: Joi.object({
                        firstName: JoiCommon.string.name.required(),
                        lastName: JoiCommon.string.name.required(),
                        email: JoiCommon.string.email.required()
                    }).required()
                }).required()
            })
        },

        response: {
            createOrder: Joi.object({
                order: Joi.object({
                    id: Joi.string().uuid(),
                    pricings: Joi.array().items(JoiCommon.string.id)
                        .required()
                }),
                clientSecret: Joi.string().required()
            }).required(),
            saveUser: Joi.object({
                user: Joi.object({
                    id: Joi.string().uuid(),
                    token: Joi.string().required()
                }).required(),
                message: Joi.string().required()
            }).required()
        }
    }

    constructor() {
        super()
    }

    private CreateOrderReqType: Joi.extractType<typeof CheckoutController.schemas.request.createOrder>
    private CreateOrderResType: Joi.extractType<typeof CheckoutController.schemas.response.createOrder>
    public async createOrder(
        req: AuthRequest & typeof this.CreateOrderReqType,
        res: Response<typeof this.CreateOrderResType>,
        next: NextFunction
    ) {
        try {
            const { user } = req
            const {
                addressID,
                shippingRateID,
                basketItems,
                recipientFirstName,
                recipientLastName,
                recipientEmail
            } = req.body

            if (user.role === UserRole.NotRegistered && (!basketItems || !basketItems.length)) {
                throw new IError(404, req.t('No items found in cart'))
            }

            const promises: Promise<any>[] = [
                prisma.address.findFirst({
                    where: {
                        id: addressID,
                        deletedAt: null
                    }
                }),
                shippingService.getRate(shippingRateID)
            ]

            if (user.role === UserRole.NotRegistered && basketItems) {
                promises.push(BasketController.selectBasketItems({
                    t: req.t,
                    basketItems: basketItems as any[]
                }))
            } else {
                promises.push(BasketController.selectBasketItems({
                    userID: user.id,
                    t: req.t
                }))
            }
            
            const [address, rate, cart] = await Promise.all(promises)

            if (!address) {
                throw new IError(404, req.t('Address not found'))
            }

            if (address.userID !== user.id) {
                throw new IError(409, req.t('Not the address owner'))
            }

            if (!rate) {
                throw new IError(404, req.t('Shipping rate not found'))
            }

            if (!cart || !cart.basketItems?.length) {
                throw new IError(404, req.t('No items found in cart'))
            }

            const totalInMinorUnits
                = Math.round((
                    Number(cart.summary.totalPrice)
                        + Number(rate.amountLocal)
                ) * 100)

            const orderID = randomUUID()
            const paymentIntent = await stripeService.createPaymentIntent(
                totalInMinorUnits, // Stripe expects the smallest currency unit
                'gbp',
                {
                    orderID,
                    userID: user.id
                }
            )

            if (!paymentIntent.client_secret) {
                throw new IError(400, req.t('Failed to create payment'))
            }

            const order = await prisma.$transaction(async (tx: typeof prisma) => {
                
                const [orderTmp] = await Promise.all([
                    tx.order.create({
                        data: {
                            id: orderID,
                            state: OrderState.Pending,
                            shippingRateID,
                            user: {
                                connect: { id: user.id }
                            },
                            addressSnapshot: address,
                            expiresAt: dayjs().add(30, 'minutes')
                                .toISOString(),
                            shippingPrice: rate.amount,
                            productsPrice: cart.summary.totalPrice,
                            recipientFirstName,
                            recipientLastName,
                            recipientEmail,
                            paymentTransactionID: paymentIntent.id,
                            orderItems: {
                                create: cart.basketItems.map((item: any) => ({
                                    quantity: item.quantity,
                                    unitPrice: item.pricing.price,
                                    snapshot: {
                                        ...item.good,
                                        itemType: item.pricing.itemType
                                    }
                                }))
                            }
                        }
                    }),
                    tx.basketItem.deleteMany({
                        where: {
                            id: {
                                in: cart.basketItems.map((item: any) => item.id)
                            },
                            userID: user.id
                        }
                    }),
                    ...cart.basketItems.map((item: any) => tx.pricing.update({
                        where: {
                            id: item.pricing.id
                        },
                        data: {
                            quantity: item.pricing.quantity - item.quantity
                        }
                    }))
                ])

                return orderTmp
            })

            return res.status(200).json({
                order: {
                    id: order.id,
                    pricings: cart.basketItems.map((item: any) => item.pricing.id)
                },
                clientSecret: paymentIntent.client_secret
            })
        } catch (e) {
            next(e)
        }
    }

    private SaveUserReqType: Joi.extractType<typeof CheckoutController.schemas.request.saveUser>
    private SaveUserResType: Joi.extractType<typeof CheckoutController.schemas.response.saveUser>
    public async saveUser(
        req: Request & typeof this.SaveUserReqType,
        res: Response<typeof this.SaveUserResType>,
        next: NextFunction
    ) {
        try {
            const { body } = req

            // Check if user isn't registered and has some valid goods in basket

            let user = await prisma.user.findFirst({
                where: {
                    email: body.user.email,
                    deletedAt: null
                }
            })
            // let [user, pricings] = await Promise.all([
            //     prisma.user.findFirst({
            //         where: {
            //             email: body.user.email,
            //             deletedAt: null
            //         }
            //     }),
            //     prisma.pricing.findMany({
            //         where: {
            //             id: {
            //                 in: body.basketItems.map((item) => item.pricingID)
            //             },
            //             deletedAt: null
            //         }
            //     })
            // ])

            if (user?.role && user.role !== UserRole.NotRegistered) {
                throw new IError(409, req.t('There is an account with such email in the system. Login into your account or use different email'))
            }

            // const nonZeroQuantityPricings = pricings.filter((pricing: Pricing) => pricing.quantity > 0)
            //
            // if (!pricings.length || !nonZeroQuantityPricings.length) {
            //     throw new IError(404, req.t('Add some products to your basket to proceed with checkout'))
            // }

            const data = {
                firstName: body.user.firstName,
                lastName: body.user.lastName,
                email: body.user.email,
                emailVerified: false,
                phone: null,
                password: null,
                role: UserRole.NotRegistered,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                    EncryptionService.encryptAES(body.user.firstName + body.user.lastName)}&size=256`
            }

            if (!user) {
                // If user doesn't exist, create one
                user = await prisma.user.create({
                    data
                })
            } else {
                // If user wasn't registered, update him
                await prisma.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        ...user,
                        ...data,
                        updatedAt: dayjs().toISOString()
                    }
                })
            }
            
            // await prisma.$transaction(async (tx: any) => {
            //     await tx.basketItem.deleteMany({
            //         where: {
            //             userID: user.id
            //         }
            //     })
            //    
            //     const basketItemsData: Array<Partial<BasketItem>> = []
            //
            //     for (const pricing of pricings) {
            //         const basketItem = body.basketItems.find((item) => item.pricingID === pricing.id)
            //         if (basketItem) {
            //             basketItemsData.push({
            //                 pricingID: basketItem.pricingID,
            //                 createdAt: dayjs(basketItem.createdAt).toISOString() as any,
            //                 userID: user.id,
            //                 quantity: basketItem.quantity
            //             })
            //         } else {
            //             continue
            //         }
            //     }
            //    
            //     await tx.basketItem.createMany({
            //         data: basketItemsData
            //     })
            // })

            return res.status(200).json({
                user: {
                    id: user.id,
                    token: JwtService.generateToken({
                        id: user.id,
                        aud: JwtAudience.userCheckout
                    }, 60 * 60)
                },
                message: req.t('User was validated successfully')
            })
        } catch (e) {
            next(e)
        }
    }
}