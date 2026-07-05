import { UserRole } from '@prisma/client'
import { Router } from 'express'

import { ShippingController } from '../../controllers/v1/ShippingController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import permissionMiddleware from '../../middlewares/permissionMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const shippingController = new ShippingController()

export default function shippingRouter() {
    router.post(
        /*
            #swagger.tags = ['v1-Shipping']
            #swagger.description = 'Get available shipping rates.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetRatesReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetRatesRes" }
            }
        */
        '/shipping',
        validationMiddleware(ShippingController.schemas.request.getRates),
        authorizationMiddleware([PassportStrategy.google, PassportStrategy.jwtCheckout]),
        shippingController.getRates
    )

    router.post(
        /*
            #swagger.tags = ['v1-Shipping']
            #swagger.description = 'Create a shipping label.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1CreateLabelReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1CreateLabelRes" }
            }
        */
        '/shipping/:orderID',
        validationMiddleware(ShippingController.schemas.request.createLabel),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        shippingController.createLabel
    )

    return router
}