import { User, UserRole } from '@prisma/client'
import config from 'config'
import { JwtPayload } from 'jsonwebtoken'
import passport from 'passport'
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20'
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt'

import logger from './Logger';
import prisma from './Prisma'
import { IConfig } from '../types/config'
import { JwtAudience, PassportStrategy } from '../utils/enums'
import { IError } from '../utils/IError'

/**
 * @class PassportSetup
 * @description Configures and initializes Passport strategies for authentication.
 * Supports Google OAuth, multiple JWT strategies (B2C, B2B, forgot password, invites),
 * and session serialization/deserialization.
 *
 * @param {IConfig['googleStrategy']} googleStrategyConfig - Google OAuth configuration
 * @param {IConfig['jwt']} jwtConfig - JWT configuration (secret, algorithm, etc.)
 * @param {IConfig['passport']} passportConfig - Passport-related configuration (extractors, etc.)
 *
 * @method googleStrategy Handles Google OAuth authentication
 * @method userJwtStrategy Handles JWT authentication for users
 * @method userJwtForgotPasswordStrategy Handles JWT for B2C password reset
 * @method adminJwtStrategy Handles JWT authentication for admins
 * @method adminJwtForgotPasswordStrategy Handles JWT for B2B password reset
 * @method serializeUser Serializes user/admin into session
 * @method deserializeUser Deserializes user/admin from session
 */
class PassportSetup {
    private googleStrategyConfig: IConfig['googleStrategy']
    private jwtConfig: IConfig['jwt']
    private passportConfig: IConfig['passport']

    /**
     * @constructor
     * @param {IConfig['googleStrategy']} googleStrategyConfig
     * @param {IConfig['jwt']} jwtConfig
     * @param {IConfig['passport']} passportConfig
     */
    constructor(
        googleStrategyConfig: IConfig['googleStrategy'],
        jwtConfig: IConfig['jwt'],
        passportConfig: IConfig['passport']
    ) {
        this.googleStrategyConfig = googleStrategyConfig
        this.jwtConfig = jwtConfig
        this.passportConfig = passportConfig

        if (this.googleStrategyConfig) {
            passport.use(PassportStrategy.google, new GoogleStrategy(
                {
                    clientID: this.googleStrategyConfig.clientID,
                    clientSecret: this.googleStrategyConfig.clientSecret,
                    callbackURL: this.googleStrategyConfig.callbackURL
                },
                this.googleStrategy
            ))
        } else {
            logger.warn('Google strategy config not provided')
        }

        passport.use(PassportStrategy.jwtUser, new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromExtractors([
                    this.passportConfig.jwtFromCookie,
                    this.passportConfig.jwtFromRequestHeader
                ]),
                secretOrKey: this.jwtConfig.secret
            },
            this.userJwtStrategy
        ))

        passport.use(PassportStrategy.jwtUserForgotPassword, new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromExtractors([this.passportConfig.jwtFromRequestHeader]),
                secretOrKey: this.jwtConfig.secret
            },
            this.userJwtForgotPasswordStrategy
        ))

        passport.use(PassportStrategy.jwtAdmin, new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromExtractors([this.passportConfig.jwtFromRequestHeader, this.passportConfig.jwtFromCookie]),
                secretOrKey: this.jwtConfig.secret
            },
            this.adminJwtStrategy
        ))

        passport.use(PassportStrategy.jwtAdminForgotPassword, new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromExtractors([this.passportConfig.jwtFromRequestHeader, this.passportConfig.jwtFromCookie]),
                secretOrKey: this.jwtConfig.secret
            },
            this.adminJwtForgotPasswordStrategy
        ))

        passport.serializeUser(this.serializeUser)
        passport.deserializeUser(this.deserializeUser)
    }

    /**
     * @method googleStrategy
     * @description Handles Google OAuth authentication:
     * - Finds or creates user in database
     * - Updates googleProfileID if missing
     *
     * @param {string} accessToken
     * @param {string} refreshToken
     * @param {Profile} profile - Google profile data
     * @param {VerifyCallback} done - Passport callback
     *
     * @returns {Promise<void>}
     */
    private async googleStrategy(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
    ): Promise<void> {
        try {
            if (!profile.emails?.length) {
                throw new IError(401, 'No email provided by google response')
            }
            let user = await prisma.user.findFirst({
                where: {
                    OR: [{
                        email: profile.emails[0].value,
                        deletedAt: null
                    },
                    {
                        googleProfileID: profile.id,
                        deletedAt: null
                    }]
                }
            })

            if (user) {
                if (!user.googleProfileID) {
                    await prisma.user.update({
                        where: {
                            id: user.id
                        },
                        data: {
                            googleProfileID: profile.id
                        }
                    })
                }
            } else {
                user = await prisma.user.create({
                    data: {
                        googleProfileID: profile.id,
                        firstName: profile.name?.givenName ?? null,
                        lastName: profile.name?.familyName ?? null,
                        email: profile.emails[0].value,
                        emailVerified: profile.emails?.length ? profile.emails[0].verified : false
                    }
                })
            }

            if (!user) {
                throw new IError(401, 'Not authorized (googleStrategy)')
            }

            return done(null, user)
        } catch {
            return done(null, false)
        }
    }

    /**
     * @method userJwtForgotPasswordStrategy
     * @description Validates JWT for B2C password reset flow
     */
    private async userJwtStrategy(payload: JwtPayload, done: VerifyCallback) {
        try {
            if (payload.aud !== JwtAudience.user) {
                throw new IError(401, 'Not authorized (JwtStrategy)')
            }

            const user = await prisma.user.findFirst({
                where: {
                    id: payload.id,
                    deletedAt: null
                }
            })

            if (!user || user.role !== UserRole.User) {
                throw new IError(401, 'Not authorized (JwtStrategy)')
            }
            
            return done(null, user)
        } catch {
            return done(null, false)
        }
    }

    /**
     * @method adminJwtForgotPasswordStrategy
     * @description Validates JWT for B2B password reset flow
     */
    private async userJwtForgotPasswordStrategy(payload: JwtPayload, done: VerifyCallback) {
        try {
            if (payload.aud !== JwtAudience.userForgotPassword) {
                throw new IError(401, 'Not authorized (JwtForgotPasswordStrategy)')
            }

            const user = await prisma.user.findFirst({
                where: {
                    id: payload.id,
                    deletedAt: null
                }
            })

            if (!user || user.role !== UserRole.User) {
                throw new IError(401, 'Not authorized (JwtForgotPasswordStrategy)')
            }
            
            return done(null, user)
        } catch {
            return done(null, false)
        }
    }

    /**
     * @method adminJwtStrategy
     * @description Validates JWT for admin (B2B) authentication
     */
    private async adminJwtStrategy(payload: JwtPayload, done: VerifyCallback) {
        try {
            if (payload.aud !== JwtAudience.admin) {
                throw new IError(401, 'Not authorized (JwtStrategy)')
            }

            const admin = await prisma.admin.findFirst({
                where: {
                    id: payload.id,
                    deletedAt: null
                }
            })

            if (!admin || admin.role !== UserRole.Admin) {
                throw new IError(401, 'Not authorized (JwtStrategy)')
            }
            return done(null, admin)
        } catch {
            return done(null, false)
        }
    }

    /**
     * @method adminJwtForgotPasswordStrategy
     * @description Validates JWT for B2B password reset flow
     */
    private async adminJwtForgotPasswordStrategy(payload: JwtPayload, done: VerifyCallback) {
        try {
            if (payload.aud !== JwtAudience.adminForgotPassword) {
                throw new IError(401, 'Not authorized (JwtForgotPasswordStrategy)')
            }

            const admin = await prisma.admin.findFirst({
                where: {
                    id: payload.id,
                    deletedAt: null
                }
            })

            if (!admin || admin.role !== UserRole.Admin) {
                throw new IError(401, 'Not authorized (JwtForgotPasswordStrategy)')
            }
            return done(null, admin)
        } catch {
            return done(null, false)
        }
    }

    /**
     * @method serializeUser
     * @description Serializes user/admin into session
     */
    private serializeUser(
        user: User,
        done: (
            err: Error | null,
            entity: { id: string | null }
        ) => void
    ): void {
        const err = !user?.id ? new IError(401, 'Authorization id is missing') : null
        done(err, {
            id: user.id
        })
    }

    /**
     * @method deserializeUser
     * @description Deserializes session entity back into user/admin
     */
    private async deserializeUser(
        entity: { id: string },
        done: (err: Error | null, user: User | null) => void
    ): Promise<void> {
        const user = await prisma.user.findFirst({
            where: {
                id: entity.id,
                deletedAt: null 
            } 
        })
        
        const err = user ? null : new IError(401, 'User wasn\'t deserialized')
        done(err, user)
    }
}

const googleStrategyConfig = config.get<IConfig['googleStrategy']>('googleStrategy')
const jwtConfig = config.get<IConfig['jwt']>('jwt')
const passportConfig = config.get<IConfig['passport']>('passport')

const passportSetup = new PassportSetup(
    googleStrategyConfig,
    jwtConfig,
    passportConfig
)

export default passportSetup