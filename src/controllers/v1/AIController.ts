import config from 'config'
import { Response, NextFunction, AuthRequest } from 'express'
import Joi from 'joi'

import { AbstractController } from '../../types/AbstractController'
import { IConfig } from '../../types/config'
import { JoiCommon } from '../../types/JoiCommon'

const ollamaConfig = config.get<IConfig['ollama']>('ollama')

export class AIController extends AbstractController {

    public static readonly schemas = {
        request: {
            postTranslations: JoiCommon.object.request.keys({
                body: Joi.object({
                    text: Joi.array().items(Joi.string().required())
                        .min(1)
                }).required()
            }),

            postGoodMetadata: JoiCommon.object.request.keys({
                body: Joi.object({
                    imageUrl: Joi.string().uri()
                        .required(),
                    name: Joi.string().required(),
                    category: Joi.string().required()
                }).required()
            })
        },

        response: {
            postTranslations: Joi.object({
                translations: Joi.array().items(JoiCommon.object.translations)
                    .min(1)
                    .required()
            }),

            postGoodMetadata: Joi.object({
                description: Joi.string().required(),
                tags: Joi.array().items({
                    id: JoiCommon.string.id.optional(),
                    name: Joi.string().required()
                })
                    .required()
            })
        }
    }

    private PostTranslationsReqType: Joi.extractType<typeof AIController.schemas.request.postTranslations>
    private PostTranslationsResType: Joi.extractType<typeof AIController.schemas.response.postTranslations>
    public async postTranslations(
        req: AuthRequest & typeof this.PostTranslationsReqType,
        res: Response & typeof this.PostTranslationsResType,
        next: NextFunction
    ) {
        try {
            if (!ollamaConfig) {
                return res.status(200).json({
                    translations: [{
                        en: 'en: ' + req.body.text,
                        ua: 'ua: ' + req.body.text,
                        de: 'de: ' + req.body.text,
                        sk: 'sk: ' + req.body.text
                    }]
                })
            }

            const response = await fetch(`${ollamaConfig.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: ollamaConfig.model,
                    stream: false,
                    format: 'json',
                    messages: [
                        {
                            role: 'user',
                            content: JSON.stringify({
                                text: req.body.text
                            })
                        }
                    ]
                })
            })

            const data: any = await response.json()
            const content = JSON.parse(data.message.content)
            return res.status(200).json(content)
        } catch (e) {
            return next(e)
        }
    }

    private PostGoodMetadataReqType: Joi.extractType<typeof AIController.schemas.request.postGoodMetadata>
    private PostGoodMetadataResType: Joi.extractType<typeof AIController.schemas.response.postGoodMetadata>
    public async postGoodMetadata(
        req: AuthRequest & typeof this.PostGoodMetadataReqType,
        res: Response & typeof this.PostGoodMetadataResType,
        next: NextFunction
    ) {
        try {
            if (!ollamaConfig) {
                return res.status(200).json({
                    description: 'Handmade ceramic cup with matte black finish, suitable for hot drinks.',
                    tags: [{
                        name: 'Red'
                    }, {
                        name: 'Miniature'
                    }]
                })
            }

            const response = await fetch(`${ollamaConfig.url}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: ollamaConfig.model,
                    stream: false,
                    format: 'json',
                    messages: [
                        {
                            role: 'user',
                            content: JSON.stringify({
                                imageUrl: req.body.imageUrl,
                                name: req.body.name,
                                category: req.body.category
                                // TODO: add tags list
                                // tags: req.body.tags
                            })
                        }
                    ]
                })
            })

            const data: any = await response.json()
            const content = JSON.parse(data.message.content)

            return res.status(200).json(content)
        } catch (e) {
            return next(e)
        }
    }
}