import { AuthRequest, NextFunction, Response } from 'express';
import Joi from 'joi';

import { AbstractController } from '../../types/AbstractController';
import { JoiCommon } from '../../types/JoiCommon';

export class TagController extends AbstractController {

    public static readonly schemas = {
        request: {
            getTags: JoiCommon.object.request.keys({
                query: Joi.object({
                    search: Joi.string().allow('')
                        .optional()
                }).required()
            }),

            putTag: JoiCommon.object.request.keys({
                body: Joi.object({
                    tagID: JoiCommon.string.id.optional(),
                    nameTID: JoiCommon.string.id.optional()
                }).required()
            }),

            deleteTag: JoiCommon.object.request.keys({
                params: Joi.object({
                    tagID: JoiCommon.string.id.required()
                }).required()
            })
        },

        response: {
            getTags: Joi.object({
                tags: Joi.array().items(Joi.object({
                    id: JoiCommon.string.id.required(),
                    nameTID: JoiCommon.string.id.required()
                }))
                    .required()
            }),

            putTag: Joi.object({
                tag: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required()
            }),

            deleteTag: Joi.object({
                success: Joi.boolean().required()
            })
        }
    }

    constructor() {
        super()
    }

    private GetTagsReqType: Joi.extractType<typeof TagController.schemas.request.getTags>
    private GetTagsResType: Joi.extractType<typeof TagController.schemas.response.getTags>
    public async getTags(
        req: AuthRequest & typeof this.GetTagsReqType,
        res: Response & typeof this.GetTagsResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                tags: []
            })
        } catch (err) {
            return next(err)
        }
    }

    private PutTagReqType: Joi.extractType<typeof TagController.schemas.request.putTag>
    private PutTagResType: Joi.extractType<typeof TagController.schemas.response.putTag>
    public async putTag(
        req: AuthRequest & typeof this.PutTagReqType,
        res: Response & typeof this.PutTagResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                tag: {
                    id: req.body.tagID
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteTagReqType: Joi.extractType<typeof TagController.schemas.request.deleteTag>
    private DeleteTagResType: Joi.extractType<typeof TagController.schemas.response.deleteTag>
    public async deleteTag(
        req: AuthRequest & typeof this.DeleteTagReqType,
        res: Response & typeof this.DeleteTagResType,
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