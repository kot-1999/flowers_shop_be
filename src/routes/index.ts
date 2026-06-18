import { Router } from 'express'

import aiRouter from './v1/AIRouter'
import categoryRouter from './v1/CategoryRouter'
import fileUploadRouter from './v1/FileUploadRouter'
import goodRouter from './v1/GoodRouter'
import itemTypeRouter from './v1/ItemTypeRouter'
import selectionistRouter from './v1/SelectionistRouter'
import tagRouter from './v1/TagRouter'
import userAuthorizationRouter from './v1/UserAuthorizationRouter'
import userRouter from './v1/UserRouter'
import logger from '../services/Logger'

const router = Router()

export default function authorizeRouters() {

    // v1
    router.use('/v1/authorization',userAuthorizationRouter())
    router.use('/v1/user', userRouter())
    router.use('/v1/ai', aiRouter())
    router.use('/v1', tagRouter())
    router.use('/v1', selectionistRouter())
    router.use('/v1', itemTypeRouter())
    router.use('/v1', categoryRouter())
    router.use('/v1', goodRouter())
    router.use('/v1/files', fileUploadRouter())

    logger.info('Application routes were initialized.')

    return router
}