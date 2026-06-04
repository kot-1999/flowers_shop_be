import { UserRole } from '@prisma/client';
import config from 'config';
import dayjs from 'dayjs';
import { Request, Response, NextFunction, AuthRequest } from 'express'
import Joi from 'joi'

import emailService from '../../services/Email'
import { EncryptionService } from '../../services/Encryption'
import { JwtService } from '../../services/Jwt'
import logger from '../../services/Logger';
import prisma from '../../services/Prisma'
import { AbstractController } from '../../types/AbstractController'
import { IConfig } from '../../types/config';
import { JoiCommon } from '../../types/JoiCommon'
import { EmailType, JwtAudience } from '../../utils/enums'
import { IError } from '../../utils/IError'

const appConfig = config.get<IConfig['app']>('app')

export class AuthorizationController extends AbstractController {
    private static readonly userSchema = Joi.object({
        user: Joi.object({
            id: JoiCommon.string.id
        }).required()
    })

    public static readonly schemas = {
        request: {
            register: JoiCommon.object.request.keys({
                body: Joi.object({
                    firstName: JoiCommon.string.name.required(),
                    lastName: JoiCommon.string.name.required(),
                    email: JoiCommon.string.email.required(),
                    password: Joi.string().min(3)
                        .required()
                }).required()
            }).required(),

            login: JoiCommon.object.request.keys({
                body: Joi.object({
                    email: JoiCommon.string.email.required(),
                    password: Joi.string().required()
                })
            }),

            me: JoiCommon.object.request,
            googleRedirect: JoiCommon.object.request,
            
            completeRegistration: JoiCommon.object.request.keys({
                body: Joi.object({
                    firstName: JoiCommon.string.name.required(),
                    lastName: JoiCommon.string.name.required(),
                    password: Joi.string().min(3)
                        .required()
                }).required()
            }).required(),

            forgotPassword: JoiCommon.object.request.keys({
                body: Joi.object({
                    email: JoiCommon.string.email.required()
                }).required()
            }),
            logout: JoiCommon.object.request,
            resetPassword: JoiCommon.object.request.keys({
                body: Joi.object({
                    newPassword: Joi.string().required()
                }).required()
            })
        },
        response: {
            register: Joi.object({
                user: Joi.object({
                    id: JoiCommon.string.id,
                    role: Joi.string().valid(...Object.values(UserRole))
                        .required()
                }).required(),
                message: Joi.string().required()
            }).required(),
            login: Joi.object({
                user: Joi.object({
                    id: JoiCommon.string.id,
                    role: Joi.string().valid(...Object.values(UserRole))
                        .required()
                }).required(),
                message: Joi.string().required()
            }).required(),
            logout: AuthorizationController.userSchema.keys({
                message: Joi.string().required()
            }).required(),
            forgotPassword: Joi.object({
                message: Joi.string().required()
            }).required(),
            completeRegistration: Joi.object({
                message: Joi.string().required()
            }).required(),
            me: Joi.object({
                user: Joi.object({
                    id: JoiCommon.string.id,
                    email: Joi.string().email()
                        .required(),
                    firstName: Joi.string().required(),
                    lastName: Joi.string().required(),
                    googleProfileID: Joi.string().allow(null),
                    role: Joi.string().valid(...Object.values(UserRole))
                        .required()
                })
            }).required(),
            resetPassword: AuthorizationController.userSchema.keys({
                message: Joi.string().required()
            }).required(),
            googleRedirect: Joi.object()
        }
    }

    constructor() {
        super()
    }

    private RegisterReqType: Joi.extractType<typeof AuthorizationController.schemas.request.register>
    private RegisterResType: Joi.extractType<typeof AuthorizationController.schemas.response.register>
    public async register(
        req: Request & typeof this.RegisterReqType,
        res: Response<typeof this.RegisterResType>,
        next: NextFunction
    ) {
        try {
            const { body } = req
            let user = await prisma.user.findFirst({
                where: {
                    email: body.email,
                    deletedAt: null
                }
            })

            if (user) {
                if (user.role && user.role === UserRole.NotRegistered) {} else {
                    throw new IError(409, req.t('User already exists. Try to login again, or use forgot password'))
                }
            }
            
            const data = {
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                emailVerified: false,
                phone: null,
                password: EncryptionService.hashSHA256(EncryptionService.decryptAES(body.password)),
                role: UserRole.User,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${EncryptionService.encryptAES(body.firstName + body.lastName)}&size=256`
            }
            
            if (!user) {
                // If user doesn't exist, create one
                user = await prisma.user.create({
                    data
                })
            } else {
                // If user wasn't registered, update him
                await prisma.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        ...user,
                        ...data,
                        avatar: user.avatar,
                        updatedAt: dayjs().toISOString()
                    }
                })
            }

            emailService.sendEmail(EmailType.registered, {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }).catch((err: Error) => {
                logger.error('EMAIL ERROR:' + err.message)
            })

            return res.status(200).json({
                user: {
                    id: user!.id,
                    role: user!.role
                },
                message: req.t('Registration completed')
            })

        } catch (err) {
            return next(err)
        }
    }

    private LoginReqType: Joi.extractType<typeof AuthorizationController.schemas.request.login>
    private LoginResType: Joi.extractType<typeof AuthorizationController.schemas.response.login>
    public async login(
        req: Request & typeof this.LoginReqType,
        res: Response<typeof this.LoginResType>,
        next: NextFunction
    ) {
        try {
            const { body } = req
            // Find user
            const user = await prisma.user.findFirst({
                where: {
                    email: body.email,
                    deletedAt: null
                }
            })

            if (!user) {
                throw new IError(401, req.t('Password or email is incorrect'))
            }

            if (user.role === UserRole.NotRegistered) {
                return res.redirect(`${appConfig.frontendUrl}/complete-registration`)
            }

            // Check password
            const decryptedPassword = EncryptionService.decryptAES(body.password)
            if (user.password !== EncryptionService.hashSHA256(decryptedPassword)) {
                throw new IError(401, req.t('Password or email is incorrect'))
            }

            req.login(user, (err) => {
                if (err) {
                    return next(err)
                }

                return res.status(200).json({
                    user: {
                        id: user.id,
                        role: user.role
                    },
                    message: req.t('Logged in successfully')
                })
            })
        } catch (err) {
            return next(err)
        }
    }

    private GoogleRedirectReqType: Joi.extractType<typeof AuthorizationController.schemas.request.googleRedirect>
    private GoogleRedirectResType: Joi.extractType<typeof AuthorizationController.schemas.response.googleRedirect>
    public googleRedirect(
        req: AuthRequest & typeof this.GoogleRedirectReqType,
        res: Response & typeof this.GoogleRedirectResType,
        next: NextFunction
    ): void | Response {
        try {
            const { user } = req
            
            if (user.role === UserRole.NotRegistered) {
                return res.redirect(`${appConfig.frontendUrl}/auth/complete-registration`)
            }

            return res.redirect(`${appConfig.frontendUrl}/`)
        } catch (err) {
            return next(err)
        }
    }

    private CompleteRegistrationReqType: Joi.extractType<typeof AuthorizationController.schemas.request.completeRegistration>
    private CompleteRegistrationResType: Joi.extractType<typeof AuthorizationController.schemas.response.completeRegistration>
    public async completeRegistration(
        req: AuthRequest & typeof this.CompleteRegistrationReqType,
        res: Response & typeof this.CompleteRegistrationResType,
        next: NextFunction
    ) {
        try {
            const { user, body } = req

            await prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    password: EncryptionService.hashSHA256(EncryptionService.decryptAES(body.password)),
                    role: UserRole.User
                }
            })

            return res.json({
                message: req.t('Registration completed')
            })
        } catch (err) {
            return next(err)
        }
    }

    private MeReqType: Joi.extractType<typeof AuthorizationController.schemas.request.me>
    private MeResType: Joi.extractType<typeof AuthorizationController.schemas.response.me>
    public me(
        req: AuthRequest & typeof this.MeReqType,
        res: Response & typeof this.MeResType,
        next: NextFunction
    ) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: req.t('Unauthorized')
                })
            }

            const user = req.user

            return res.status(200).json({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                googleProfileID: user.googleProfileID,
                role: user.role
            })
        } catch (err) {
            return next(err)
        }
    }

    private LogoutReqType: Joi.extractType<typeof AuthorizationController.schemas.request.logout>
    private LogoutResType: Joi.extractType<typeof AuthorizationController.schemas.response.logout>
    public async logout(
        req: AuthRequest & typeof this.LogoutReqType,
        res: Response<typeof this.LogoutResType>,
        next: NextFunction
    ) {
        try {
            const userID = req.user.id
            // Wrap req.logout() in a Promise
            await new Promise<void>((resolve, reject) => {
                req.logout((err) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve();
                });
            });

            // Destroy the session after logout
            await new Promise<void>((resolve, reject) => {
                req.session.destroy((err) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve();
                });
            });

            res
                .clearCookie('connect.sid')
                .status(200)
                .json({
                    user: {
                        id: userID
                    },
                    message: req.t('User was logged out')
                })
        } catch (err) {
            return next(err)
        }
    }

    private ForgotPasswordReqType: Joi.extractType<typeof AuthorizationController.schemas.request.forgotPassword>
    private ForgotPasswordResType: Joi.extractType<typeof AuthorizationController.schemas.response.forgotPassword>
    public async forgotPassword(
        req: Request & typeof this.ForgotPasswordReqType,
        res: Response<typeof this.ForgotPasswordResType>,
        next: NextFunction
    ) {
        try {
            const { body: { email } } = req

            const user = await prisma.user.findFirst({
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true
                },
                where: {
                    email: email,
                    deletedAt: null
                    
                }
            })

            if (user) {
                emailService.sendEmail(EmailType.forgotPassword, {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    jwtToken: user.role === UserRole.Admin ? JwtService.generateToken({
                        id: user.id,
                        aud: JwtAudience.adminForgotPassword
                    }) : JwtService.generateToken({
                        id: user.id,
                        aud: JwtAudience.userForgotPassword
                    })
                })
            }

            res.status(200).json({
                message: req.t('Email with password recovery link was successfully sent')
            })
        } catch (err) {
            return next(err)
        }
    }
    private ResetPasswordReqType: Joi.extractType<typeof AuthorizationController.schemas.request.resetPassword>
    private ResetPasswordResType: Joi.extractType<typeof AuthorizationController.schemas.response.resetPassword>
    public async resetPassword(
        req: AuthRequest & typeof this.ResetPasswordReqType,
        res: Response<typeof this.ResetPasswordResType>,
        next: NextFunction
    ) {
        try {
            const { body: { newPassword }, user } = req

            const updatedUser = await prisma.user.update({
                data: {
                    password: EncryptionService.hashSHA256(EncryptionService.decryptAES(newPassword))
                },
                where: {
                    id: user.id
                },
                select: {
                    id: true
                }
            })

            res.status(200).json({
                user: {
                    id: updatedUser.id
                },
                message: req.t('Password was reset successfully')
            })
        } catch (err) {
            return next(err)
        }
    
    }
}