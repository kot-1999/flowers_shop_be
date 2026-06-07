import { Router } from 'express'

import { CategoryController } from '../../controllers/v1/CategoryController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const categoriesController = new CategoryController()

export default function categoriesRouter() {
    router.get(
        /*
            #swagger.tags = ['v1-Categories']
            #swagger.description = 'Get categories.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetCategoriesReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetCategoriesRes" }
            }
        */
        '/',
        validationMiddleware(CategoryController.schemas.request.getCategories),
        categoriesController.getCategories
    )

    router.put(
        /*
            #swagger.tags = ['v1-Categories']
            #swagger.description = 'Update or create category.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PutCategoryReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PutCategoryRes" }
            }
        */
        '/',
        validationMiddleware(CategoryController.schemas.request.putCategory),
        authorizationMiddleware([PassportStrategy.google]),
        categoriesController.putCategory
    )

    router.delete(
        /*
            #swagger.tags = ['v1-Categories']
            #swagger.description = 'Delete category.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1DeleteCategoryReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1DeleteCategoryRes" }
            }
        */
        '/:categoryID',
        validationMiddleware(CategoryController.schemas.request.deleteCategory),
        authorizationMiddleware([PassportStrategy.google]),
        categoriesController.deleteCategory
    )

    return router
}