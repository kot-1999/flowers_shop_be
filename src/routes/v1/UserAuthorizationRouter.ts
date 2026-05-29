import { Router } from 'express'
import passport from 'passport'

import { AuthorizationController } from '../../controllers/v1/AuthorizationController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

// Init router and controller
const router = Router()
const authorizationController = new AuthorizationController()

export default function userAuthorizationRouter() {
    // List endpoints
    router.post(
        /*
            #swagger.tags = ['v1-UserAuthorization']
            #swagger.description = 'Register a new user.',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/v1RegisterReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1RegisterRes" }
            }
        */
        '/register',
        validationMiddleware(AuthorizationController.schemas.request.register),
        authorizationController.register
    )
    router.post(
        /*
            #swagger.tags = ['v1-UserAuthorization']
            #swagger.description = 'Authorize a user',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/v1LoginReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1LoginRes" }
            }
        */
        '/login',
        validationMiddleware(AuthorizationController.schemas.request.login),
        authorizationController.login
    )
    router.get(
        /*
            #swagger.tags = ['v1-UserAuthorization']
            #swagger.description = 'Google OAuth2 endpoint',
        */
        '/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    )

    router.get(
        /*
            #swagger.tags = ['v1-UserAuthorization']
            #swagger.description = 'Google OAuth2 redirect endpoint',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/v1GoogleRedirectReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GoogleRedirectRes" }
            }
        */
        '/google/redirect',
        passport.authenticate('google'),
        authorizationController.googleRedirect
    )

    router.get(
        /*
            #swagger.tags = ['v1-UserAuthorization']
            #swagger.description = 'Logout a user.',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/v1LogoutReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1LogoutRes" }
            }
        */
        '/logout',
        authorizationMiddleware([PassportStrategy.jwtUser, PassportStrategy.jwtAdmin, PassportStrategy.google]),
        authorizationController.logout
    )

    router.post(
        /*
           #swagger.tags = ['v1-UserAuthorization']
           #swagger.description = 'Send email with password reset link.',
           #swagger.parameters['body'] = {
               in: 'body',
               schema: { $ref: '#/definitions/v1ForgotPasswordReqBody' }
           }
           #swagger.responses[200] = {
               schema: { "$ref": "#/definitions/v1ForgotPasswordRes" }
           }
       */
        '/forgot-password',
        validationMiddleware(AuthorizationController.schemas.request.forgotPassword),
        authorizationController.forgotPassword
    )

    router.post(
        /*
           #swagger.tags = ['b2c-v1-UserAuthorization']
           #swagger.description = 'Resets a password.',
           #swagger.parameters['body'] = {
               in: 'body',
               schema: { $ref: '#/definitions/b2cV1ResetPasswordReqBody' }
           }
           #swagger.responses[200] = {
               schema: { "$ref": "#/definitions/b2cV1ResetPasswordRes" }
           }
       */
        '/reset-password',
        validationMiddleware(AuthorizationController.schemas.request.resetPassword),
        authorizationMiddleware([PassportStrategy.jwtUserForgotPassword, PassportStrategy.jwtAdminForgotPassword]),
        authorizationController.resetPassword
    )
    return router
}
