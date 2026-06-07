import { AuthRequest, NextFunction, Response } from 'express';
import Joi from 'joi';

import { AbstractController } from '../../types/AbstractController';
import { JoiCommon } from '../../types/JoiCommon';

export class TranslationController extends AbstractController {

    public static readonly schemas = {
        request: {
            putTranslation: JoiCommon.object.request.keys({
                body: Joi.object({
                    translationID: JoiCommon.string.id.required(),
                    translation: JoiCommon.object.translations.required()
                }).required()
            })
        },

        response: {
            putTranslation: Joi.object({
                translation: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required()
            })
        }
    }

    constructor() {
        super()
    }

    private PutTranslationReqType: Joi.extractType<typeof TranslationController.schemas.request.putTranslation>
    private PutTranslationResType: Joi.extractType<typeof TranslationController.schemas.response.putTranslation>

    public async putTranslation(
        req: AuthRequest & typeof this.PutTranslationReqType,
        res: Response & typeof this.PutTranslationResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                translation: {
                    id: req.body.translationID
                }
            })
        } catch (err) {
            return next(err)
        }
    }
}