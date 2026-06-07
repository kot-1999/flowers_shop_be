import { AuthRequest, NextFunction, Response } from 'express';
import Joi from 'joi';

import { AbstractController } from '../../types/AbstractController';
import { JoiCommon } from '../../types/JoiCommon';

export class CategoryController extends AbstractController {

    public static readonly schemas = {
        request: {
            getCategories: JoiCommon.object.request.keys({
                query: Joi.object({
                    sort: Joi.string().valid('asc', 'desc')
                        .default('asc')
                }).required()
            }),

            putCategory: JoiCommon.object.request.keys({
                body: Joi.object({
                    categoryID: JoiCommon.string.id.optional(),
                    nameTID: JoiCommon.string.id.optional(),
                    descriptionTID: JoiCommon.string.id.optional(),
                    coverImage: Joi.string().uri()
                        .allow(null)
                        .optional()
                }).required()
            }),

            deleteCategory: JoiCommon.object.request.keys({
                params: Joi.object({
                    categoryID: JoiCommon.string.id.required()
                }).required()
            })
        },

        response: {
            getCategories: Joi.object({
                categories: Joi.array().items(Joi.object({
                    id: JoiCommon.string.id.required(),
                    nameTID: JoiCommon.string.id.required(),
                    coverImage: Joi.string().allow(null)
                }))
                    .required()
            }),

            putCategory: Joi.object({
                category: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required()
            }),

            deleteCategory: Joi.object({
                success: Joi.boolean().required()
            })
        }
    }

    constructor() {
        super()
    }

    private GetCategoriesReqType: Joi.extractType<typeof CategoryController.schemas.request.getCategories>
    private GetCategoriesResType: Joi.extractType<typeof CategoryController.schemas.response.getCategories>
    public async getCategories(
        req: AuthRequest & typeof this.GetCategoriesReqType,
        res: Response & typeof this.GetCategoriesResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                categories: []
            })
        } catch (err) {
            return next(err)
        }
    }

    private PutCategoryReqType: Joi.extractType<typeof CategoryController.schemas.request.putCategory>
    private PutCategoryResType: Joi.extractType<typeof CategoryController.schemas.response.putCategory>
    public async putCategory(
        req: AuthRequest & typeof this.PutCategoryReqType,
        res: Response & typeof this.PutCategoryResType,
        next: NextFunction
    ) {
        try {
            return res.status(200).json({
                category: {
                    id: req.body.categoryID
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteCategoryReqType: Joi.extractType<typeof CategoryController.schemas.request.deleteCategory>
    private DeleteCategoryResType: Joi.extractType<typeof CategoryController.schemas.response.deleteCategory>
    public async deleteCategory(
        req: AuthRequest & typeof this.DeleteCategoryReqType,
        res: Response & typeof this.DeleteCategoryResType,
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