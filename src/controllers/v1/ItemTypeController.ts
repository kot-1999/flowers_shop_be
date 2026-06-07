import { AuthRequest, NextFunction, Response } from 'express';
import Joi from 'joi';

import { AbstractController } from '../../types/AbstractController';
import { JoiCommon } from '../../types/JoiCommon';

export class ItemTypeController extends AbstractController {

    public static readonly schemas = {
        request: {
            getItemTypes: JoiCommon.object.request.keys({
                query: Joi.object({
                    search: Joi.string().allow('')
                        .optional(),
                    sort: Joi.string().valid('asc', 'desc')
                        .default('asc')
                }).required()
            }),

            patchItemType: JoiCommon.object.request.keys({
                params: Joi.object({
                    itemTypeID: JoiCommon.string.id.required()
                }).required(),

                body: Joi.object({
                    nameTID: JoiCommon.string.id.optional(),
                    weight: Joi.number().optional()
                }).required()
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
                    nameTID: JoiCommon.string.id.required(),
                    weight: Joi.number().required()
                }))
                    .required()
            }),

            patchItemType: Joi.object({
                itemType: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required()
            }),

            deleteItemType: Joi.object({
                success: Joi.boolean().required()
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
        res: Response & typeof this.GetItemTypesResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                itemTypes: []
            })
        } catch (err) {
            return next(err)
        }
    }

    private PatchItemTypeReqType: Joi.extractType<typeof ItemTypeController.schemas.request.patchItemType>
    private PatchItemTypeResType: Joi.extractType<typeof ItemTypeController.schemas.response.patchItemType>
    public async patchItemType(
        req: AuthRequest & typeof this.PatchItemTypeReqType,
        res: Response & typeof this.PatchItemTypeResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                itemType: {
                    id: req.params.itemTypeID
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteItemTypeReqType: Joi.extractType<typeof ItemTypeController.schemas.request.deleteItemType>
    private DeleteItemTypeResType: Joi.extractType<typeof ItemTypeController.schemas.response.deleteItemType>
    public async deleteItemType(
        req: AuthRequest & typeof this.DeleteItemTypeReqType,
        res: Response & typeof this.DeleteItemTypeResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                success: true
            })
        } catch (err) {
            return next(err)
        }
    }
}