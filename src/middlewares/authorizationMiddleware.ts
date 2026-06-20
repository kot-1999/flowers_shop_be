import { NextFunction, Request, RequestHandler, Response } from 'express'
import passport from 'passport'

import { PassportStrategy } from '../utils/enums'
import { IError } from '../utils/IError'

export default function authorizationMiddleware(allowedStrategies: PassportStrategy[], isOptional?: boolean): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // If user is using passport-google-oauth-20 strategy
            if (allowedStrategies.includes(PassportStrategy.google) && req.isAuthenticated()) {
                return next()
            } if (isOptional) {
                return next()
            }

            // If user is using some of JWT strategies
            const middleware = passport.authenticate(allowedStrategies.filter((strategy) => strategy !== PassportStrategy.google), {
                session: false
            })
            return  middleware(req, res, next)
        } catch {
            throw new IError(401, req.t('Unauthorized'))
        }
    }
}