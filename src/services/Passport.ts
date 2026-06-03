import { User, UserRole } from '@prisma/client'
import config from 'config'
import { JwtPayload } from 'jsonwebtoken'
import passport from 'passport'
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20'
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt'

import { EncryptionService } from './Encryption';
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
 * @method userJwtForgotPasswordStrategy Handles JWT for B2C password reset
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

        passport.use(PassportStrategy.jwtUserForgotPassword, new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromExtractors([this.passportConfig.jwtFromRequestHeader]),
                secretOrKey: this.jwtConfig.secret
            },
            this.userJwtForgotPasswordStrategy
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
                const firstName = profile.name?.givenName ?? 'Name'
                const lastName = profile.name?.familyName ?? 'Surname'
                user = await prisma.user.create({
                    data: {
                        googleProfileID: profile.id,
                        firstName,
                        lastName,
                        email: profile.emails[0].value,
                        emailVerified: profile.emails?.length ? profile.emails[0].verified : false,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                            EncryptionService.encryptAES(firstName + lastName)
                        }&size=256`
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
            id?: string | false
        ) => void
    ): void {
        if (!user?.id) {
            return done(null, false)  // Pass false, not an error
        }
        done(null, user.id)  // Pass the ID directly, not an object
    }

    /**
     * @method deserializeUser
     * @description Deserializes session entity back into user/admin
     */
    private async deserializeUser(
        id: string,
        done: (err: Error | null, user: User | false | null) => void
    ): Promise<void> {
        try {

            if (!id) {
                return done(null, false)
            }

            const user = await prisma.user.findFirst({
                where: {
                    id: id,
                    deletedAt: null
                }
            })

            done(null, user || false)
        } catch {
            done(null, false)
        }
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