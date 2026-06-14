import dayjs from 'dayjs'
import { AuthRequest, NextFunction, Response } from 'express'
import Joi from 'joi'

import prisma from '../../services/Prisma'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { translationSelect } from '../../utils/helpers'
import { IError } from '../../utils/IError'

export class CategoryController extends AbstractController {

    public static readonly schemas = {
        request: {
            getCategories: JoiCommon.object.request.keys({
                query: Joi.object({
                    sort: Joi.string().valid('asc', 'desc')
                        .default('asc')
                }).required()
            }),

            getAdminCategories: JoiCommon.object.request.keys({
                query: Joi.object({
                    sort: Joi.string().valid('asc', 'desc')
                        .default('asc')
                }).required()
            }),

            putCategory: JoiCommon.object.request.keys({
                body: Joi.object({
                    categoryID: JoiCommon.string.id.optional(),

                    nameTID: JoiCommon.string.id.optional(),
                    nameTranslations: JoiCommon.object.translationsReq,
                    descriptionTID: JoiCommon.string.id.optional(),
                    descriptionTranslations: JoiCommon.object.translationsReq,
                    coverImage: Joi.string()
                        .allow(null)
                        .optional(),
                    restore: Joi.boolean().default(false)
                }).or('nameTID', 'nameTranslations')
                    .or('descriptionTID', 'descriptionTranslations')
                    .required()
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
                    coverImage: Joi.string().allow(null),

                    name: JoiCommon.object.singleTranslationWithSlug.required(),
                    description: JoiCommon.object.singleTranslation.required()
                }))
                    .required()
            }),

            getAdminCategories: Joi.object({
                categories: Joi.array().items(Joi.object({
                    id: JoiCommon.string.id.required(),
                    coverImage: Joi.string().allow(null),

                    name: JoiCommon.object.translationsRes,
                    description: JoiCommon.object.translationsRes
                }))
                    .required()
            }),

            putCategory: Joi.object({
                category: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required(),
                message: Joi.string().required()
            }),

            deleteCategory: Joi.object({
                message: Joi.string().required()
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
        res: Response<typeof this.GetCategoriesResType>,
        next: NextFunction
    ) {
        try {
            const language = req.headers['accept-language']
            const { query } = req

            const categories = await prisma.category.findMany({
                where: {
                    deletedAt: null
                },
                select: {
                    id: true,
                    coverImage: true,
                    name: {
                        select: {
                            [language as string]: true,
                            [language + 'Slug']: true
                        }
                    },
                    description: {
                        select: {
                            [language as string]: true
                        }
                    }
                },
                orderBy: {
                    name: {
                        [language as string + 'Slug']: query.sort
                    }
                }
            })
            
            return res.status(200).json({
                categories
            })
        } catch (err) {
            return next(err)
        }
    }

    private GetAdminCategoriesReqType: Joi.extractType<typeof CategoryController.schemas.request.getAdminCategories>
    private GetAdminCategoriesResType: Joi.extractType<typeof CategoryController.schemas.response.getAdminCategories>
    public async getAdminCategories(
        req: AuthRequest & typeof this.GetAdminCategoriesReqType,
        res: Response<typeof this.GetAdminCategoriesResType>,
        next: NextFunction
    ) {
        try {
            const language = req.headers['accept-language']
            const { query } = req

            const categories = await prisma.category.findMany({
                select: {
                    id: true,
                    coverImage: true,
                    createdAt: true,
                    deletedAt: true,
                    name: {
                        select: translationSelect
                    },
                    description: {
                        select: translationSelect
                    }
                },
                orderBy: [
                    { deletedAt: 'desc' },
                    {
                        name: {
                            [language as string + 'Slug']: query.sort
                        }
                    }
                ]
            })

            return res.status(200).json({
                categories
            })
        } catch (err) {
            return next(err)
        }
    }

    private PutCategoryReqType: Joi.extractType<typeof CategoryController.schemas.request.putCategory>
    private PutCategoryResType: Joi.extractType<typeof CategoryController.schemas.response.putCategory>
    public async putCategory(
        req: AuthRequest & typeof this.PutCategoryReqType,
        res: Response<typeof this.PutCategoryResType>,
        next: NextFunction
    ) {
        try {
            const { body } = req
            const [category, nameTranslation, descriptionTranslation] = await Promise.all([
                body.categoryID ? prisma.category.findFirst({
                    where: {
                        id: body.categoryID
                    },
                    select: {
                        id: true,
                        nameTID: true,
                        descriptionTID: true,
                        deletedAt: true
                    }
                }) : null,
                body.nameTID ? prisma.translation.findFirst({
                    where: { id: body.nameTID },
                    select: {
                        id: true
                    } 
                }) : null,
                body.descriptionTID ? prisma.translation.findFirst({
                    where: { id: body.descriptionTID },
                    select: {
                        id: true
                    } 
                }) : null
            ])

            const data: any = {
                coverImage: body.coverImage ?? null
            }

            if (body.categoryID && !category) {
                throw new IError(404, req.t('Category not found'))
            }

            if (body.nameTID && !nameTranslation) {
                throw new IError(404, req.t('Name translations not found'))
            }

            if (body.descriptionTID && !descriptionTranslation) {
                throw new IError(404, req.t('Description translations not found'))
            }
            
            if (body.nameTID) {
                data.name = { connect: { id: body.nameTID } }
            } else {
                data.name = {
                    create: body.nameTranslations
                }
            }
            
            if (body.descriptionTID) {
                data.descriptionTID = { connect: { id: body.descriptionTID } }
            } else {
                data.description = {
                    create: body.descriptionTranslations
                }
            }
            let categoryResolved: { id: string, nameTID: string, descriptionTID: string }
            if (body.categoryID) {
                categoryResolved = await prisma.category.update({
                    where: {
                        id: body.categoryID
                    },
                    data: {
                        ...data,
                        deletedAt: body.restore ? null : category.deletedAt
                    },
                    select: {
                        id: true,
                        nameTID: true,
                        descriptionTID: true 
                    }
                })
            } else {
                categoryResolved = await prisma.category.create({
                    data,
                    select: {
                        id: true,
                        nameTID: true,
                        descriptionTID: true 
                    }
                })
            }

            // Delete old translations
            if (category) {
                await Promise.all([
                    category.nameTID !== categoryResolved.nameTID
                        ? prisma.translation.delete({ where: { id: category.nameTID } }) : null,
                    category.descriptionTID !== categoryResolved.descriptionTID
                        ? prisma.translation.delete({ where: { id: category.descriptionTID } }) : null
                ])
            }
            
            return res.status(200).json({
                category: {
                    id: categoryResolved.id
                },
                message: body.categoryID ? req.t('Category updated') : req.t('New category created')
            })
            
        } catch (err) {
            return next(err)
        }
    }

    private DeleteCategoryReqType: Joi.extractType<typeof CategoryController.schemas.request.deleteCategory>
    private DeleteCategoryResType: Joi.extractType<typeof CategoryController.schemas.response.deleteCategory>
    public async deleteCategory(
        req: AuthRequest & typeof this.DeleteCategoryReqType,
        res: Response<typeof this.DeleteCategoryResType>,
        next: NextFunction
    ) {
        try {
            const { params } = req

            const category = await prisma.category.findFirst({
                where: {
                    id: params.categoryID,
                    deletedAt: null
                },
                select: {
                    id: true
                }
            })
            
            if (!category) {
                throw new IError(404, req.t('Category not found'))
            }

            await prisma.category.update({
                where: {
                    id: params.categoryID
                },
                data: {
                    deletedAt: dayjs().toISOString()
                }
            })

            return res.status(200).json({
                message: req.t('Category was deleted')
            })
        } catch (err) {
            return next(err)
        }
    }
}