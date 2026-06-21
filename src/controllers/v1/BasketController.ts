import { AuthRequest, NextFunction, Response } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'

export class BasketController extends AbstractController {
    private static readonly basketItemSchema = Joi.object({
        id: JoiCommon.string.id.required(),

        quantity: Joi.number()
            .integer()
            .min(1)
            .required(),

        goodID: JoiCommon.string.id.required(),
        pricingID: JoiCommon.string.id.required(),

        createdAt: Joi.date()
            .iso()
            .required()
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
                    .items(this.basketItemSchema)
                    .required()
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

    private GetBasketItemsReqType: Joi.extractType<typeof BasketController.schemas.request.getBasketItems>
    private GetBasketItemsResType: Joi.extractType<typeof BasketController.schemas.response.getBasketItems>

    public async getBasketItems(
        req: AuthRequest & typeof this.GetBasketItemsReqType,
        res: Response<typeof this.GetBasketItemsResType>,
        next: NextFunction
    ) {
        try {
            //
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
            //
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
            //
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
            //
        } catch (err) {
            return next(err)
        }
    }
}