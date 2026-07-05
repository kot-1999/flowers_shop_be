import { AuthRequest, NextFunction, OptionalAuthRequest, Response } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'

export class ShippingController extends AbstractController {
    public static readonly schemas = {
        request: {
            getRates: JoiCommon.object.request.keys({
                body: Joi.object({
                    addressID: Joi.string().uuid()
                        .required(),
                    userID: Joi.string().uuid()
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

            return res.json()
        } catch (e) {
            next(e)
        }
    }

    private CreateLabelReqType: Joi.extractType<typeof ShippingController.schemas.request.createLabel>
    private CreateLabelResType: Joi.extractType<typeof ShippingController.schemas.response.createLabel>
    public async createLabel(
        req: OptionalAuthRequest & typeof this.CreateLabelReqType,
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