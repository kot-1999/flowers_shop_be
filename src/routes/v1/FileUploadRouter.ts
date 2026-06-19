import { UserRole } from '@prisma/client'
import { Router } from 'express'

import { FileUpload } from '../../controllers/v1/FileUpload'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import permissionMiddleware from '../../middlewares/permissionMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const fileUpload = new FileUpload()

export default function FileUploadRouter() {

    router.put(
        /*
            #swagger.tags = ['File-Upload']
            #swagger.description = 'Upload a file.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/v1PutFileReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PutFileRes" },
            }
        */
        '/upload',
        validationMiddleware(FileUpload.schemas.request.putFile),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin, UserRole.User]),
        fileUpload.putFile
    )

    return router
}