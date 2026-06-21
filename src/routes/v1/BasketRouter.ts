import { Router } from 'express'

import { BasketController } from '../../controllers/v1/BasketController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const basketController = new BasketController()

export default function basketRouter() {
    router.get(
        /*
            #swagger.tags = ['v1-Basket']
            #swagger.description = 'Get user basket items.'
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetBasketItemsRes" }
            }
        */
        '/basket-items',
        validationMiddleware(BasketController.schemas.request.getBasketItems),
        authorizationMiddleware([PassportStrategy.google]),
        basketController.getBasketItems
    )

    router.post(
        /*
            #swagger.tags = ['v1-Basket']
            #swagger.description = 'Add item to basket.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PostBasketItemReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PostBasketItemRes" }
            }
        */
        '/basket-items',
        validationMiddleware(BasketController.schemas.request.postBasketItem),
        authorizationMiddleware([PassportStrategy.google]),
        basketController.postBasketItem
    )

    router.patch(
        /*
            #swagger.tags = ['v1-Basket']
            #swagger.description = 'Update basket item.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PatchBasketItemReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PatchBasketItemRes" }
            }
        */
        '/basket-items/:basketItemID',
        validationMiddleware(BasketController.schemas.request.patchBasketItem),
        authorizationMiddleware([PassportStrategy.google]),
        basketController.patchBasketItem
    )

    router.delete(
        /*
            #swagger.tags = ['v1-Basket']
            #swagger.description = 'Delete basket item.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1DeleteBasketItemReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1DeleteBasketItemRes" }
            }
        */
        '/basket-items/:basketItemID',
        validationMiddleware(BasketController.schemas.request.deleteBasketItem),
        authorizationMiddleware([PassportStrategy.google]),
        basketController.deleteBasketItem
    )

    return router
}