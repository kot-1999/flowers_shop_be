import { UserRole } from '@prisma/client'
import { Router } from 'express'

import { ItemTypeController } from '../../controllers/v1/ItemTypeController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import permissionMiddleware from '../../middlewares/permissionMiddleware'
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
        '/admin/item-types',
        validationMiddleware(ItemTypeController.schemas.request.getItemTypes),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        // @ts-ignore
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
        '/admin/item-types',
        validationMiddleware(ItemTypeController.schemas.request.putItemType),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
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
        '/admin/item-types/:itemTypeID',
        validationMiddleware(ItemTypeController.schemas.request.deleteItemType),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        itemTypesController.deleteItemType
    )

    return router
}