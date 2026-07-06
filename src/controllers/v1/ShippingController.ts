import { Address, User } from '@prisma/client'
import { AuthRequest, NextFunction, Response } from 'express'
import Joi from 'joi'

import { BasketController } from './BasketController'
import prisma from '../../services/Prisma'
import shippingService from '../../services/ShippingService'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { Language } from '../../utils/enums'
import { IError } from '../../utils/IError'

export class ShippingController extends AbstractController {
    public static readonly schemas = {
        request: {
            getRates: JoiCommon.object.request.keys({
                body: Joi.object({
                    addressID: Joi.string().uuid()
                        .required()
                }).required()
            }),

            createLabel: JoiCommon.object.request.keys({
                params: Joi.object({
                    orderID: Joi.string().uuid()
                        .required()
                })
            })
        },

        response: {
            getRates: Joi.object({

            }),

            createLabel: Joi.object({

            })
        }
    }

    constructor() {
        super()
    }

    private GetRatesReqType: Joi.extractType<typeof ShippingController.schemas.request.getRates>
    private GetRatesResType: Joi.extractType<typeof ShippingController.schemas.response.getRates>
    public async getRates(
        req: AuthRequest & typeof this.GetRatesReqType,
        res: Response<typeof this.GetRatesResType>,
        next: NextFunction
    ) {
        try {
            const { user, body } = req
            const language = req.headers['accept-language'] as Language

            const address: Address & { user: User } = await prisma.address.findFirst({
                where: {
                    id: body.addressID
                },
                select: {
                    apartment: true,
                    building: true,
                    street: true,
                    city: true,
                    postcode: true,
                    country: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true
                        }
                    }
                }
            })

            if (!address) {
                throw new IError(404, req.t('Address not found'))
            }

            if (address.user.id !== user.id) {
                throw new IError(403, req.t('Not the address holder'))
            }

            const { basketItems } = await BasketController.selectBasketItems({
                userID: user.id,
                language,
                t: req.t
            })

            const result = await shippingService.createShipment(address, basketItems.map((item: any) => ({
                ...item,
                pricing: {
                    ...item.pricing,
                    good: item.good
                }
            })))

            return res.status(200).json(result)
        } catch (e) {
            next(e)
        }
    }

    private CreateLabelReqType: Joi.extractType<typeof ShippingController.schemas.request.createLabel>
    private CreateLabelResType: Joi.extractType<typeof ShippingController.schemas.response.createLabel>
    public async createLabel(
        req: AuthRequest & typeof this.CreateLabelReqType,
        res: Response<typeof this.CreateLabelResType>,
        next: NextFunction
    ) {
        try {

            return res.json()
        } catch (e) {
            next(e)
        }
    }
}