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

    router.patch(
        /*
            #swagger.tags = ['v1-ItemTypes']
            #swagger.description = 'Update item type.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PatchItemTypeReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PatchItemTypeRes" }
            }
        */
        '/:itemTypeID',
        validationMiddleware(ItemTypeController.schemas.request.patchItemType),
        authorizationMiddleware([PassportStrategy.google]),
        itemTypesController.patchItemType
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