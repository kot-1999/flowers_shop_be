import { UserRole } from '@prisma/client'
import { Router } from 'express'

import { TagController } from '../../controllers/v1/TagController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import permissionMiddleware from '../../middlewares/permissionMiddleware'
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
        '/tags',
        validationMiddleware(TagController.schemas.request.getTags),
        tagsController.getTags
    )

    router.get(
        /*
            #swagger.tags = ['v1-Tags']
            #swagger.description = 'Get admin tags.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetAdminTagsReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetAdminTagsRes" }
            }
        */
        '/admin/tags',
        validationMiddleware(TagController.schemas.request.getAdminTags),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        tagsController.getAdminTags
    )

    router.put(
        /*
            #swagger.tags = ['v1-Tags']
            #swagger.description = 'Update tag.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PutTagReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PutTagRes" }
            }
        */
        '/admin/tags',
        validationMiddleware(TagController.schemas.request.putTag),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        tagsController.putTag
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
        '/admin/tags/:tagID',
        validationMiddleware(TagController.schemas.request.deleteTag),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        tagsController.deleteTag
    )

    return router
}