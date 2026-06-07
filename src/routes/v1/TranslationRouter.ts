import { Router } from 'express'

import { TranslationController } from '../../controllers/v1/TranslationController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const translationsController = new TranslationController()

export default function translationsRouter() {
    router.patch(
        /*
            #swagger.tags = ['v1-Translations']
            #swagger.description = 'Update translation.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PatchTranslationReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PatchTranslationRes" }
            }
        */
        '/:translationID',
        validationMiddleware(TranslationController.schemas.request.patchTranslation),
        authorizationMiddleware([PassportStrategy.google]),
        translationsController.patchTranslation
    )

    return router
}