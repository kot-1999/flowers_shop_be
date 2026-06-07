import { AuthRequest, NextFunction, Response } from 'express';
import Joi from 'joi';

import { AbstractController } from '../../types/AbstractController';
import { JoiCommon } from '../../types/JoiCommon';

export class SelectionistController extends AbstractController {

    public static readonly schemas = {
        request: {
            getSelectionists: JoiCommon.object.request.keys({
                query: Joi.object({
                    search: Joi.string().allow('')
                        .optional(),
                    sort: Joi.string().valid('asc', 'desc')
                        .default('asc')
                }).required()
            }),

            patchSelectionist: JoiCommon.object.request.keys({
                params: Joi.object({
                    selectionistID: JoiCommon.string.id.required()
                }).required(),

                body: Joi.object({
                    name: Joi.string().optional(),
                    country: Joi.string().optional()
                }).required()
            }),

            deleteSelectionist: JoiCommon.object.request.keys({
                params: Joi.object({
                    selectionistID: JoiCommon.string.id.required()
                }).required()
            })
        },

        response: {
            getSelectionists: Joi.object({
                selectionists: Joi.array().items(Joi.object({
                    id: JoiCommon.string.id.required(),
                    name: Joi.string().required(),
                    country: Joi.string().required()
                }))
                    .required()
            }),

            patchSelectionist: Joi.object({
                selectionist: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required()
            }),

            deleteSelectionist: Joi.object({
                success: Joi.boolean().required()
            })
        }
    }

    constructor() {
        super()
    }

    private GetSelectionistsReqType: Joi.extractType<typeof SelectionistController.schemas.request.getSelectionists>
    private GetSelectionistsResType: Joi.extractType<typeof SelectionistController.schemas.response.getSelectionists>

    public async getSelectionists(
        req: AuthRequest & typeof this.GetSelectionistsReqType,
        res: Response & typeof this.GetSelectionistsResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                selectionists: []
            })
        } catch (err) {
            return next(err)
        }
    }

    private PatchSelectionistReqType: Joi.extractType<typeof SelectionistController.schemas.request.patchSelectionist>
    private PatchSelectionistResType: Joi.extractType<typeof SelectionistController.schemas.response.patchSelectionist>

    public async patchSelectionist(
        req: AuthRequest & typeof this.PatchSelectionistReqType,
        res: Response & typeof this.PatchSelectionistResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                selectionist: {
                    id: req.params.selectionistID
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteSelectionistReqType: Joi.extractType<typeof SelectionistController.schemas.request.deleteSelectionist>
    private DeleteSelectionistResType: Joi.extractType<typeof SelectionistController.schemas.response.deleteSelectionist>
    public async deleteSelectionist(
        req: AuthRequest & typeof this.DeleteSelectionistReqType,
        res: Response & typeof this.DeleteSelectionistResType,
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