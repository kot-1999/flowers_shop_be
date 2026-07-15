import { Router } from 'express'

import addressRouter from './v1/AddressRouter'
import aiRouter from './v1/AIRouter'
import basketRouter from './v1/BasketRouter'
import categoryRouter from './v1/CategoryRouter'
import checkoutRouter from './v1/CheckoutRouter'
import fileUploadRouter from './v1/FileUploadRouter'
import goodRouter from './v1/GoodRouter'
import itemTypeRouter from './v1/ItemTypeRouter'
import orderRouter from './v1/OrderRouter'
import selectionistRouter from './v1/SelectionistRouter'
import shippingRouter from './v1/ShippingRoutes'
import tagRouter from './v1/TagRouter'
import userAuthorizationRouter from './v1/UserAuthorizationRouter'
import userRouter from './v1/UserRouter'
import logger from '../services/Logger'

const router = Router()

export default function authorizeRouters() {

    // v1
    router.use('/v1/authorization',userAuthorizationRouter())
    router.use('/v1', userRouter())
    router.use('/v1/ai', aiRouter())
    router.use('/v1', tagRouter())
    router.use('/v1', selectionistRouter())
    router.use('/v1', itemTypeRouter())
    router.use('/v1', categoryRouter())
    router.use('/v1', goodRouter())
    router.use('/v1/files', fileUploadRouter())
    router.use('/v1', addressRouter())
    router.use('/v1', basketRouter())
    router.use('/v1', shippingRouter())
    router.use('/v1', checkoutRouter())
    router.use('/v1', orderRouter())
    logger.info('Application routes were initialized.')

    return router
}