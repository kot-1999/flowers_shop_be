import { BasketItem, Pricing, UserRole } from '@prisma/client'
import dayjs from 'dayjs'
import { AuthRequest, NextFunction, Request, Response } from 'express'
import Joi from 'joi'

import { EncryptionService } from '../../services/Encryption'
import { JwtService } from '../../services/Jwt'
import prisma from '../../services/Prisma'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { JwtAudience } from '../../utils/enums'
import { IError } from '../../utils/IError'

export class CheckoutController extends AbstractController {
    public static readonly schemas = {
        request: {
            createOrder: JoiCommon.object.request.keys({
                body: Joi.object({
                    addressID: Joi.string().uuid()
                        .required(),
                    userID: Joi.string().uuid()
                        .required()
                }).required()
            }),
            saveUser: JoiCommon.object.request.keys({
                body: Joi.object({
                    user: Joi.object({
                        firstName: JoiCommon.string.name.required(),
                        lastName: JoiCommon.string.name.required(),
                        email: JoiCommon.string.email.required()
                    }).required(),
                    basketItems: Joi.array().items(Joi.object({
                        pricingID: Joi.string().required(),
                        quantity: Joi.number().integer()
                            .required(),
                        createdAt: Joi.date().iso()
                            .required()
                    }))
                        .min(1)
                        .required()
                }).required()
            })
        },

        response: {
            createOrder: Joi.object({
                order: Joi.object({
                    id: Joi.string().uuid()
                })
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
            // const { addressID, userID } = req.body
            //
            // const address = shippingService.createShipment()
            return res.json()
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

            // eslint-disable-next-line prefer-const
            let [user, pricings] = await Promise.all([
                prisma.user.findFirst({
                    where: {
                        email: body.user.email,
                        deletedAt: null
                    }
                }),
                prisma.pricing.findMany({
                    where: {
                        id: {
                            in: body.basketItems.map((item) => item.pricingID)
                        },
                        deletedAt: null
                    }
                })
            ])

            if (user?.role && user.role !== UserRole.NotRegistered) {
                throw new IError(409, req.t('There is an account with such email in the system. Login into your account or use different email'))
            }

            const nonZeroQuantityPricings = pricings.filter((pricing: Pricing) => pricing.quantity > 0)

            if (!pricings.length || !nonZeroQuantityPricings.length) {
                throw new IError(404, req.t('Add some products to your basket to proceed with checkout'))
            }

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
            
            await prisma.$transaction(async (tx: any) => {
                if (!user) {
                    // If user doesn't exist, create one
                    user = await tx.user.create({
                        data
                    })
                } else {
                    // If user wasn't registered, update him
                    await tx.user.update({
                        where: {
                            id: user.id
                        },
                        data: {
                            ...user,
                            ...data,
                            avatar: user.avatar,
                            updatedAt: dayjs().toISOString()
                        }
                    })
                }
                
                await tx.basketItem.deleteMany({
                    where: {
                        userID: user.id
                    }
                })
                
                const basketItemsData: Array<Partial<BasketItem>> = []

                for (const pricing of pricings) {
                    const basketItem = body.basketItems.find((item) => item.pricingID === pricing.id)
                    if (basketItem) {
                        basketItemsData.push({
                            pricingID: basketItem.pricingID,
                            createdAt: dayjs(basketItem.createdAt).toISOString() as any,
                            userID: user.id,
                            quantity: basketItem.quantity
                        })
                    } else {
                        continue
                    }
                }
                
                await tx.basketItem.createMany({
                    data: basketItemsData
                })
            })

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