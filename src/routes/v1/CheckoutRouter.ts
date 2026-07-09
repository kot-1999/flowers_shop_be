import { Router } from 'express'

import { CheckoutController } from '../../controllers/v1/CheckoutController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const checkoutController = new CheckoutController()

export default function checkoutRouter() {
    router.post(
        /*
            #swagger.tags = ['v1-Checkout']
            #swagger.description = 'Save guest user information before checkout.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1SaveUserReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1SaveUserRes" }
            }
        */
        '/checkout/user',
        validationMiddleware(CheckoutController.schemas.request.saveUser),
        checkoutController.saveUser
    )

    router.post(
        /*
            #swagger.tags = ['v1-Checkout']
            #swagger.description = 'Create order.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1CreateOrderReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1CreateOrderRes" }
            }
        */
        '/checkout/order',
        validationMiddleware(CheckoutController.schemas.request.createOrder),
        authorizationMiddleware([PassportStrategy.google, PassportStrategy.jwtCheckout]),
        checkoutController.createOrder
    )

    router.post(
        /*
            #swagger.tags = ['v1-Checkout']
            #swagger.description = 'Refund an order.'
            #swagger.parameters['orderID'] = {
                in: 'path',
                description: 'Order ID',
                required: true,
                type: 'string'
            }
            #swagger.responses[200] = {
                schema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string'
                        }
                    }
                }
            }
        */
        '/checkout/order/:orderID/refund',
        authorizationMiddleware([PassportStrategy.google]),
        checkoutController.refundOrder
    )

    return router
}