import { Router } from 'express'

import aiRouter from './v1/AIRouter'
import categoryRouter from './v1/CategoryRouter'
import itemTypeRouter from './v1/ItemTypeRouter'
import selectionistRouter from './v1/SelectionistRouter'
import tagRouter from './v1/TagRouter'
import translationRouter from './v1/TranslationRouter'
import userAuthorizationRouter from './v1/UserAuthorizationRouter'
import userRouter from './v1/UserRouter'
import { FileUpload } from '../controllers/FileUpload';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import validationMiddleware from '../middlewares/validationMiddleware';
import logger from '../services/Logger'
import { PassportStrategy } from '../utils/enums';

const fileUpload = new FileUpload()

const router = Router()

export default function authorizeRouters() {

    // v1
    router.use('/v1/authorization',userAuthorizationRouter())
    router.use('/v1/user', userRouter())
    router.use('/v1/tags', tagRouter())
    router.use('/v1/translations', translationRouter())
    router.use('/v1', selectionistRouter())
    router.use('/v1', itemTypeRouter())
    router.use('/v1', categoryRouter())
    router.use('/v1/ai', aiRouter())


    // Other
    router.put(
        /*
            #swagger.tags = ['File-Upload']
            #swagger.description = 'Upload a file.',
            #swagger.security = [{
                "bearerAuth": []
            }]
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { $ref: '#/definitions/b2bV1PutFileReqBody' }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/b2bV1PutFileRes" },
            }
        */
        '/upload-url',
        validationMiddleware(FileUpload.schemas.request.putFile),
        authorizationMiddleware([PassportStrategy.google]),
        fileUpload.putFile
    )

    logger.info('Application routes were initialized.')

    return router
}