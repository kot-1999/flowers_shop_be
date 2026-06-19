import { Router } from 'express'

import { AIController } from '../../controllers/v1/AIController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

// Init router and controller
const router = Router()
const aiController = new AIController()

export default function authorizationRouter() {
    // List endpoints
    router.post(
        /*
            #swagger.tags = ['v1-AI']
            #swagger.description = 'Get translations',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/v1PostTranslationsReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PostTranslationsRes" },
            }
        */
        '/translations',
        validationMiddleware(AIController.schemas.request.postTranslations),
        authorizationMiddleware([PassportStrategy.google]),
        aiController.postTranslations
    )

    router.post(
        /*
            #swagger.tags = ['v1-AI']
            #swagger.description = 'Get good metadata.',
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/v1PostGoodMetadataReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PostGoodMetadataRes" },
            }
        */
        '/good-metadata',
        validationMiddleware(AIController.schemas.request.postGoodMetadata),
        authorizationMiddleware([PassportStrategy.google]),
        aiController.postGoodMetadata
    )

    return router
}
