import { Country, Selectionist } from '@prisma/client'
import dayjs from 'dayjs'
import { AuthRequest, NextFunction, Response, Request } from 'express'
import Joi from 'joi'

import prisma from '../../services/Prisma'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { slugify, translationSelect } from '../../utils/helpers'
import { IError } from '../../utils/IError'

export class SelectionistController extends AbstractController {

    public static readonly schemas = {
        request: {
            getSelectionists: JoiCommon.object.request.keys({
                query: JoiCommon.object.paginatedQuery.keys({
                    search: Joi.string().allow('')
                        .optional(),
                    categoryID: JoiCommon.string.id.optional(),
                    sort: Joi.string().valid('asc', 'desc')
                        .default('asc')
                }).required()
            }),

            putSelectionist: JoiCommon.object.request.keys({
                body: Joi.object({
                    selectionistID: JoiCommon.string.id.optional(),
                    nameTID: Joi.string().optional(),
                    nameTranslations: JoiCommon.object.translationsReq,
                    country: Joi.string().valid(...Object.values(Country))
                        .optional()
                }).or('nameTranslations', 'nameTID')
                    .required()
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
                    name: JoiCommon.object.translationsRes.required(),
                    country: Joi.string().valid(...Object.values(Country))
                        .allow(null)
                        .required(),
                    createdAt: Joi.date().iso()
                        .required(),
                    updatedAt: Joi.date().iso()
                        .required()
                }))
                    .required(),
                pagination: JoiCommon.object.paginationRes
            }),

            putSelectionist: Joi.object({
                selectionist: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required(),
                message: Joi.string().required()
            }),

            deleteSelectionist: Joi.object({
                message: Joi.string().required()
            })
        }
    }

    constructor() {
        super()
    }

    private GetSelectionistsReqType: Joi.extractType<typeof SelectionistController.schemas.request.getSelectionists>
    private GetSelectionistsResType: Joi.extractType<typeof SelectionistController.schemas.response.getSelectionists>

    public async getSelectionists(
        req: Request & typeof this.GetSelectionistsReqType,
        res: Response<typeof this.GetSelectionistsResType>,
        next: NextFunction
    ) {
        try {
            const { query } = req
            const skip = (query.page - 1) * query.limit
            const language = req.headers['accept-language']

            const where: any = {
                deletedAt: null
            }

            if (query.categoryID) {
                where.goods = {
                    some: {
                        categoryID: query.categoryID
                    }
                }
            }

            if (query.search) {
                const terms = slugify(query.search).split('-')

                where.name = {
                    AND: terms.map((term: string) => ({
                        [`${language}Slug`]: {
                            contains: term
                        }
                    }))
                }
            }

            const [selectionists, count] = await Promise.all([
                prisma.selectionist.findMany({
                    select: {
                        id: true,
                        country: true,
                        name: {
                            select: translationSelect
                        },
                        createdAt: true,
                        updatedAt: true
                    },
                    where,
                    take: query.limit,
                    skip,
                    orderBy: {
                        name: {
                            [language as string + 'Slug']: query.sort
                        }
                    }
                }),
                prisma.selectionist.count({ where })
            ])

            return res.status(200).json({
                selectionists: selectionists.map((selectionist: Selectionist) => ({
                    ...selectionist,
                    country: selectionist.country ? req.t(selectionist.country as string) : null
                })),
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total: count
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private PutSelectionistReqType: Joi.extractType<typeof SelectionistController.schemas.request.putSelectionist>
    private PutSelectionistResType: Joi.extractType<typeof SelectionistController.schemas.response.putSelectionist>

    public async putSelectionist(
        req: AuthRequest & typeof this.PutSelectionistReqType,
        res: Response & typeof this.PutSelectionistResType,
        next: NextFunction
    ) {
        try {
            const { body } = req

            const [selectionist, nameTranslation] = await Promise.all([
                body.selectionistID
                    ? prisma.selectionist.findFirst({
                        where: {
                            id: body.selectionistID,
                            deletedAt: null
                        },
                        select: {
                            id: true,
                            nameTID: true
                        }
                    }) : null,
                body.nameTID ? prisma.translation.findFirst({
                    where: { id: body.nameTID },
                    select: {
                        id: true
                    }
                }) : null
            ])

            if (body.selectionistID && !selectionist) {
                throw new IError(404, req.t('Selectionist not found'))
            }

            if (body.nameTID && !nameTranslation) {
                throw new IError(404, req.t('Name translations not found'))
            }

            const data: any = {
                country: body.country ?? null
            }

            if (body.nameTID) {
                data.name = {
                    connect: { id: body.nameTID }
                }
            } else {
                data.name = {
                    create: body.nameTranslations
                }
            }

            let selectionistResolved
            if (body.selectionistID) {
                selectionistResolved = await prisma.selectionist.update({
                    where: { id: body.selectionistID },
                    data,
                    select: {
                        id: true,
                        nameTID: true
                    }
                })
            } else {
                selectionistResolved = await prisma.selectionist.create({
                    data,
                    select: {
                        id: true,
                        nameTID: true
                    }
                })
            }

            // cleanup old translation if replaced
            if (selectionist && selectionistResolved.nameTID !== selectionist.nameTID) {
                await prisma.translation.delete({
                    where: { id: selectionist.nameTID }
                })
            }

            return res.status(200).json({
                selectionist: {
                    id: selectionistResolved.id
                },
                message: body.selectionistID
                    ? req.t('Selectionist updated')
                    : req.t('Selectionist created')
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
            const { params } = req

            const [selectionist, selectionistNumInGoods] = await Promise.all([
                prisma.selectionist.findFirst({
                    where: {
                        id: params.selectionistID,
                        deletedAt: null
                    },
                    select: {
                        id: true
                    }
                }),
                prisma.good.count({
                    where: {
                        selectionistID: params.selectionistID,
                        deletedAt: null
                    }
                })
            ])

            if (!selectionist) {
                throw new IError(404, req.t('Selectionist not found'))
            }

            if (selectionistNumInGoods > 0) {
                throw new IError(403, req.t('Selectionist appears in {{count}} non-deleted good(s).', { count: selectionistNumInGoods }))
            }

            await prisma.selectionist.update({
                where: {
                    id: params.selectionistID
                },
                data: {
                    deletedAt: dayjs().toISOString()
                }
            })

            return res.status(200).json({
                message: req.t('Selectionist deleted')
            })
        } catch (err) {
            return next(err)
        }
    }
}