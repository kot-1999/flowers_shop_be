import { AuthRequest, NextFunction, Response } from 'express';
import Joi from 'joi';

import { AbstractController } from '../../types/AbstractController';
import { JoiCommon } from '../../types/JoiCommon';

export class TranslationController extends AbstractController {

    public static readonly schemas = {
        request: {
            patchTranslation: JoiCommon.object.request.keys({
                params: Joi.object({
                    translationID: JoiCommon.string.id.required()
                }).required(),

                body: Joi.object({
                    en: Joi.string().required(),
                    ua: Joi.string().required(),
                    de: Joi.string().required(),
                    sk: Joi.string().required()
                }).required()
            })
        },

        response: {
            patchTranslation: Joi.object({
                translation: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required()
            })
        }
    }

    constructor() {
        super()
    }

    private PatchTranslationReqType: Joi.extractType<typeof TranslationController.schemas.request.patchTranslation>
    private PatchTranslationResType: Joi.extractType<typeof TranslationController.schemas.response.patchTranslation>

    public async patchTranslation(
        req: AuthRequest & typeof this.PatchTranslationReqType,
        res: Response & typeof this.PatchTranslationResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                translation: {
                    id: req.params.translationID
                }
            })
        } catch (err) {
            return next(err)
        }
    }
}