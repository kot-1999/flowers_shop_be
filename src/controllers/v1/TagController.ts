import { AuthRequest, NextFunction, Response } from 'express'
import Joi from 'joi'

import prisma from '../../services/Prisma'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { slugify, translationSelect } from '../../utils/helpers'
import { IError } from '../../utils/IError'

export class TagController extends AbstractController {

    public static readonly schemas = {
        request: {
            getTags: JoiCommon.object.request.keys({
                query: JoiCommon.object.paginatedQuery.keys({
                    search: Joi.string().allow('')
                        .optional(),
                    sort: Joi.string()
                        .valid('asc', 'desc')
                        .default('asc')
                }).required()
            }),
            getAdminTags: JoiCommon.object.request.keys({
                query: JoiCommon.object.paginatedQuery.keys({
                    search: Joi.string().allow('')
                        .optional(),
                    sort: Joi.string()
                        .valid('asc', 'desc')
                        .default('asc')
                }).required()
            }),
            putTag: JoiCommon.object.request.keys({
                body: Joi.object({
                    tagID: JoiCommon.string.id.optional(),
                    nameTID: JoiCommon.string.id.optional(),
                    nameTranslations: JoiCommon.object.translations,
                    restore: Joi.boolean().default(false)
                }).or('nameTranslations', 'nameTID')
                    .required()
            }),

            deleteTag: JoiCommon.object.request.keys({
                params: Joi.object({
                    tagID: JoiCommon.string.id
                }).required()
            })
        },

        response: {
            getTags: Joi.object({
                tags: Joi.array().items(Joi.object({
                    id: JoiCommon.string.id,
                    name: JoiCommon.object.singleTranslation.required()
                }))
                    .required(),
                pagination: JoiCommon.object.paginationRes.required()
            }),
            getAdminTags: Joi.object({
                tags: Joi.array().items(Joi.object({
                    id: JoiCommon.string.id.required(),

                    name: JoiCommon.object.translations.required(),

                    createdAt: Joi.date().iso()
                        .required(),
                    updatedAt: Joi.date().iso()
                        .required()
                }))
                    .required(),
                pagination: JoiCommon.object.paginationRes.required()
            }),
            putTag: Joi.object({
                tag: Joi.object({
                    id: JoiCommon.string.id
                }).required(),
                message: Joi.string().required()
            }),

            deleteTag: Joi.object({
                message: Joi.string().required()
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
        res: Response<typeof this.GetTagsResType>,
        next: NextFunction
    ) {
        try {
            const { query } = req
            const skip = (query.page - 1) * query.limit
            const language = req.headers['accept-language']

            const where: any = {
                deletedAt: null
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

            const [tags, count] = await Promise.all([
                prisma.tag.findMany({
                    select: {
                        id: true,
                        name: {
                            select: { [language as string]: true }
                        }
                    },
                    where,
                    take: query.limit,
                    skip,
                    orderBy: {
                        name: {
                            [language as string + 'Slug']: 'asc'
                        }
                    }
                }),
                prisma.tag.count({ where })
            ])

            return res.status(200).json({
                tags,
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

    private GetAdminTagsReqType: Joi.extractType<typeof TagController.schemas.request.getAdminTags>
    private GetAdminTagsResType: Joi.extractType<typeof TagController.schemas.response.getAdminTags>
    public async getAdminTags(
        req: AuthRequest & typeof this.GetAdminTagsReqType,
        res: Response<typeof this.GetAdminTagsResType>,
        next: NextFunction
    ) {
        try {
            const { query } = req
            const skip = (query.page - 1) * query.limit
            const language = req.headers['accept-language']

            const where: any = { }

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

            const [tags, count] = await Promise.all([
                prisma.tag.findMany({
                    select: {
                        id: true,
                        createdAt: true,
                        updatedAt: true,
                        name: {
                            select: translationSelect
                        }
                    },
                    where,
                    take: query.limit,
                    skip,
                    orderBy: [
                        {
                            deletedAt: 'desc'
                        },
                        {
                            name: {
                                [language as string + 'Slug']: 'asc'
                            }
                        }]
                }),
                prisma.tag.count({ where })
            ])

            return res.status(200).json({
                tags,
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

    private PutTagReqType: Joi.extractType<typeof TagController.schemas.request.putTag>
    private PutTagResType: Joi.extractType<typeof TagController.schemas.response.putTag>
    public async putTag(
        req: AuthRequest & typeof this.PutTagReqType,
        res: Response<typeof this.PutTagResType>,
        next: NextFunction
    ) {
        try {
            const { body } = req

            const [tag, nameTranslation] = await Promise.all([
                body.tagID ? prisma.tag.findFirst({
                    where: {
                        id: body.tagID
                    },
                    select: {
                        id: true,
                        nameTID: true,
                        deletedAt: true
                    }
                }) : null,

                body.nameTID ? prisma.translation.findFirst({
                    where: {
                        id: body.nameTID
                    },
                    select: {
                        id: true
                    }
                }) : null
            ])

            if (body.tagID && !tag) {
                throw new IError(404, req.t('Tag not found'))
            }

            if (body.nameTID && !nameTranslation) {
                throw new IError(404, req.t('Name translations not found'))
            }

            const data: any = {
                deletedAt: body.restore || !tag ? null : tag.deletedAt
            }

            if (body.nameTID) {
                data.name = {
                    connect: {
                        id: body.nameTID
                    }
                }
            } else {
                data.name = {
                    create: body.nameTranslations
                }
            }

            let tagResolved: {
                id: string
                nameTID: string
            }

            if (body.tagID) {
                tagResolved = await prisma.tag.update({
                    where: {
                        id: body.tagID
                    },
                    data,
                    select: {
                        id: true,
                        nameTID: true
                    }
                })
            } else {
                tagResolved = await prisma.tag.create({
                    data,
                    select: {
                        id: true,
                        nameTID: true
                    }
                })
            }

            if (tag && tagResolved.nameTID !== tag.nameTID) {
                await prisma.translation.delete({
                    where: {
                        id: tag.nameTID
                    }
                })
            }

            return res.status(200).json({
                tag: {
                    id: tagResolved.id
                },
                message: body.tagID
                    ? req.t('Tag updated')
                    : req.t('New tag created')
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteTagReqType: Joi.extractType<typeof TagController.schemas.request.deleteTag>
    private DeleteTagResType: Joi.extractType<typeof TagController.schemas.response.deleteTag>
    public async deleteTag(
        req: AuthRequest & typeof this.DeleteTagReqType,
        res: Response<typeof this.DeleteTagResType>,
        next: NextFunction
    ) {
        try {
            const { params } = req

            const tag = await prisma.tag.findFirst({
                where: {
                    id: params.tagID,
                    deletedAt: null
                },
                select: {
                    id: true
                }
            })

            if (!tag) {
                throw new IError(404, req.t('Tag not found'))
            }

            await prisma.tag.update({
                where: {
                    id: params.tagID
                },
                data: {
                    deletedAt: new Date()
                }
            })

            return res.status(200).json({
                message: req.t('Tag deleted')
            })
        } catch (err) {
            return next(err)
        }
    }
}