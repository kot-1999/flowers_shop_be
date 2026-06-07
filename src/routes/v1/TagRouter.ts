import { Router } from 'express'

import { TagController } from '../../controllers/v1/TagController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const tagsController = new TagController()

export default function tagsRouter() {
    router.get(
        /*
            #swagger.tags = ['v1-Tags']
            #swagger.description = 'Get tags.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetTagsReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetTagsRes" }
            }
        */
        '/',
        validationMiddleware(TagController.schemas.request.getTags),
        tagsController.getTags
    )

    router.patch(
        /*
            #swagger.tags = ['v1-Tags']
            #swagger.description = 'Update tag.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PatchTagReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PatchTagRes" }
            }
        */
        '/:tagID',
        validationMiddleware(TagController.schemas.request.patchTag),
        authorizationMiddleware([PassportStrategy.google]),
        tagsController.patchTag
    )

    router.delete(
        /*
            #swagger.tags = ['v1-Tags']
            #swagger.description = 'Delete tag.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1DeleteTagReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1DeleteTagRes" }
            }
        */
        '/:tagID',
        validationMiddleware(TagController.schemas.request.deleteTag),
        authorizationMiddleware([PassportStrategy.google]),
        tagsController.deleteTag
    )

    return router
}