import { Router } from 'express'

import { ItemTypeController } from '../../controllers/v1/ItemTypeController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const itemTypesController = new ItemTypeController()

export default function itemTypesRouter() {
    router.get(
        /*
            #swagger.tags = ['v1-ItemTypes']
            #swagger.description = 'Get item types.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetItemTypesReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetItemTypesRes" }
            }
        */
        '/',
        validationMiddleware(ItemTypeController.schemas.request.getItemTypes),
        authorizationMiddleware([PassportStrategy.google]),
        itemTypesController.getItemTypes
    )

    router.put(
        /*
            #swagger.tags = ['v1-ItemTypes']
            #swagger.description = 'Update or create item type.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PutItemTypeReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PutItemTypeRes" }
            }
        */
        '/',
        validationMiddleware(ItemTypeController.schemas.request.putItemType),
        authorizationMiddleware([PassportStrategy.google]),
        itemTypesController.putItemType
    )

    router.delete(
        /*
            #swagger.tags = ['v1-ItemTypes']
            #swagger.description = 'Delete item type.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1DeleteItemTypeReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1DeleteItemTypeRes" }
            }
        */
        '/:itemTypeID',
        validationMiddleware(ItemTypeController.schemas.request.deleteItemType),
        authorizationMiddleware([PassportStrategy.google]),
        itemTypesController.deleteItemType
    )

    return router
}