import { User, UserRole } from '@prisma/client'
import dayjs from 'dayjs'
import { Response, NextFunction, AuthRequest, OptionalAuthRequest } from 'express'
import Joi from 'joi'

import s3Service from '../../services/AwsS3'
import prisma from '../../services/Prisma'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { isUrl, slugify } from '../../utils/helpers'
import { IError } from '../../utils/IError'

export class UsersController extends AbstractController {
    private static readonly userSchema = Joi.object({
        id: JoiCommon.string.id,
        firstName: JoiCommon.string.name.required(),
        lastName: JoiCommon.string.name.required(),
        firstNameSlug: Joi.string().required(),
        lastNameSlug: Joi.string().required(),
        email: JoiCommon.string.email.allow(null),
        emailVerified: Joi.boolean().required(),
        avatar: Joi.string().required()
            .allow(null),
        role: Joi.string().valid(...Object.values(UserRole))
            .required(),
        createdAt: Joi.date().iso()
            .required(),
        updatedAt: Joi.date().iso()
            .allow(null)
            .required()
    })
    public static readonly schemas = {
        request: {
            getUser: JoiCommon.object.request.keys({
                params: Joi.object({
                    userID: JoiCommon.string.id
                }).required()
            }).required(),

            getUsers: JoiCommon.object.request.keys({
                query: JoiCommon.object.paginatedQuery.keys({
                    search: Joi.string()
                })
            }),
            patchUser: JoiCommon.object.request.keys({
                params: Joi.object({
                    userID: JoiCommon.string.id
                }).required(),

                body: Joi.object({
                    firstName: JoiCommon.string.name.optional(),
                    lastName: JoiCommon.string.name.optional(),
                    avatar: Joi.string().optional()
                }).min(1)
                    .required()
            }),

            deleteUser: JoiCommon.object.request.required()
        },
        response: {
            getUser: Joi.object({
                user: this.userSchema.required()
            }),

            getUsers: Joi.object({
                users: Joi.array().items(this.userSchema.required())
                    .required(),
                paginationRes: JoiCommon.object.paginationRes.required()
            }),

            patchUser: Joi.object({
                user: Joi.object({
                    id: JoiCommon.string.id
                }).required(),
                message: Joi.string().required()
            }).required(),

            deleteUser: Joi.object({
                user: Joi.object({
                    id: JoiCommon.string.id
                }),
                message: Joi.string().required()
            }).required()
        }
    }

    constructor() {
        super()
    }

    private GetUserReqType: Joi.extractType<typeof UsersController.schemas.request.getUser>
    private GetUserResType: Joi.extractType<typeof UsersController.schemas.response.getUser>
    async getUser(
        req: OptionalAuthRequest & typeof this.GetUserReqType,
        res: Response<typeof this.GetUserResType>,
        next: NextFunction
    ) {
        try {
            let resultUser: typeof this.GetUserResType['user'] | null = null
            const { user, params: { userID } } = req
            if (user?.id === userID) {
                resultUser = {
                    id: user.id,
                    firstName: user.firstName,
                    firstNameSlug: user.firstNameSlug as string,
                    lastName: user.lastName,
                    lastNameSlug: user.lastNameSlug as string,
                    email: user.email,
                    avatar: user.avatar,
                    emailVerified: user.emailVerified,
                    role: user.role,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            } else {
                resultUser = await prisma.user.findFirst({
                    where: {
                        id: userID,
                        deletedAt: null
                    },
                    select: {
                        id: true,
                        firstName: true,
                        firstNameSlug: true,
                        lastName: true,
                        lastNameSlug: true,
                        avatar: true,
                        emailVerified: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true
                    }
                })
            }
            
            if (!resultUser) {
                throw new IError(404, req.t('User was not found'))
            }

            return res.status(200).json({
                user: {
                    ...resultUser,
                    avatar: !isUrl(resultUser.avatar) && resultUser.avatar ? s3Service.getPublicUrl(resultUser.avatar) : resultUser.avatar
                }
            })
        } catch (err) {
            return next(err)
        }
    }
    
    private GetUsersReqType: Joi.extractType<typeof UsersController.schemas.request.getUsers>
    private GetUsersResType: Joi.extractType<typeof UsersController.schemas.response.getUsers>
    public async getUsers(
        req: AuthRequest & typeof this.GetUsersReqType,
        res: Response<typeof this.GetUsersResType>,
        next: NextFunction
    ) {
        try {
            const { query } = req

            const skip = (query.page - 1) * query.limit

            const where: any = {
                deletedAt: null
            }

            if (query.search) {
                const terms = slugify(query.search).split('-')
                    .filter(Boolean)
                where.OR = [
                    ...terms.map((term) => ({
                        firstNameSlug: { contains: term }
                    })),
                    ...terms.map((term) => ({
                        lastNameSlug: { contains: term }
                    })),
                    ...terms.map((term) => ({
                        email: { contains: term }
                    }))
                ]
            }

            const orderBy = {
                createdAt: 'desc'
            }

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: query.limit,
                    orderBy,
                    select: {
                        id: true,
                        firstName: true,
                        firstNameSlug: true,
                        lastName: true,
                        lastNameSlug: true,
                        email: true,
                        emailVerified: true,
                        avatar: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }),

                prisma.user.count({
                    where
                })
            ])

            return res.status(200).json({
                users: users.map((user: User) => ({
                    ...user,
                    avatar: !isUrl(user.avatar) && user.avatar ? s3Service.getPublicUrl(user.avatar) : user.avatar
                })),
                paginationRes: {
                    page: query.page,
                    limit: query.limit,
                    total
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private PatchUserReqType: Joi.extractType<typeof UsersController.schemas.request.patchUser>
    private PatchUserResType: Joi.extractType<typeof UsersController.schemas.response.patchUser>

    public async patchUser(
        req: AuthRequest & typeof this.PatchUserReqType,
        res: Response<typeof this.PatchUserResType>,
        next: NextFunction
    ) {
        try {
            const { params, body, user } = req

            if (user.id !== params.userID) {
                throw new IError(403, req.t('Operation forbidden'))
            }

            const updateData: any = {}

            if (body.firstName) {
                updateData.firstName = body.firstName
            }

            if (body.lastName) {
                updateData.lastName = body.lastName
            }

            if (body.avatar) {
                updateData.avatar = body.avatar
            }

            const updatedUser = await prisma.user.update({
                where: {
                    id: params.userID
                },
                data: updateData,
                select: {
                    id: true
                }
            })

            return res.status(200).json({
                user: {
                    id: updatedUser.id
                },
                message: req.t('User updated successfully')
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteUserReqType: Joi.extractType<typeof UsersController.schemas.request.deleteUser>
    private DeleteUserResType: Joi.extractType<typeof UsersController.schemas.response.deleteUser>
    public async deleteUser(
        req: AuthRequest & typeof this.DeleteUserReqType,
        res: Response<typeof this.DeleteUserResType>,
        next: NextFunction
    ) {
        try {
            const { user } = req

            await prisma.user.update({
                where: { id: user.id },
                data: { deletedAt: dayjs().toISOString() }
            })

            return res.status(200).json({
                user: {
                    id: user.id
                },
                message: req.t('User was deleted successfully.')
            })
        } catch (err) {
            return next(err)
        }
    }
}