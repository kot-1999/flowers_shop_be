import { UserRole } from '@prisma/client'
import { Router } from 'express'

import { OrderController } from '../../controllers/v1/OrderController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import permissionMiddleware from '../../middlewares/permissionMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const orderController = new OrderController()

export default function orderRouter() {
    router.get(
        /*
            #swagger.tags = ['v1-Orders']
            #swagger.description = 'Get current user orders.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetOrdersReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetOrdersRes" }
            }
        */
        '/orders',
        validationMiddleware(OrderController.schemas.request.getOrders),
        authorizationMiddleware([PassportStrategy.google]),
        // @ts-ignore
        orderController.getOrders
    )

    router.get(
        /*
            #swagger.tags = ['v1-Orders']
            #swagger.description = 'Get all orders.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetAdminOrdersReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetAdminOrdersRes" }
            }
        */
        '/admin/orders',
        validationMiddleware(OrderController.schemas.request.getAdminOrders),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        // @ts-ignore
        orderController.getAdminOrders
    )

    router.get(
        /*
            #swagger.tags = ['v1-Orders']
            #swagger.description = 'Get current user order.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetOrderReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetOrderRes" }
            }
        */
        '/orders/:orderID',
        validationMiddleware(OrderController.schemas.request.getOrder),
        authorizationMiddleware([PassportStrategy.google]),
        orderController.getOrder
    )

    router.get(
        /*
            #swagger.tags = ['v1-Orders']
            #swagger.description = 'Get order by ID.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetOrderReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetOrderRes" }
            }
        */
        '/admin/orders/:orderID',
        validationMiddleware(OrderController.schemas.request.getOrder),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        orderController.getAdminOrder
    )

    return router
}