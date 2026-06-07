import { Router } from 'express'

import { SelectionistController } from '../../controllers/v1/SelectionistController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const selectionistsController = new SelectionistController()

export default function selectionistsRouter() {
    router.get(
        /*
           #swagger.tags = ['v1-Selectionists']
           #swagger.description = 'Get selectionists.'
           #swagger.parameters['body'] = {
               in: 'body',
               schema: { "$ref": "#/definitions/v1GetSelectionistsReqBody" }
           }
           #swagger.responses[200] = {
               schema: { "$ref": "#/definitions/v1GetSelectionistsRes" }
           }
       */
        '/',
        validationMiddleware(SelectionistController.schemas.request.getSelectionists),
        selectionistsController.getSelectionists
    )

    router.put(
        /*
            #swagger.tags = ['v1-Selectionists']
            #swagger.description = 'Update selectionist.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PutSelectionistReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PutSelectionistRes" }
            }
        */
        '/',
        validationMiddleware(SelectionistController.schemas.request.putSelectionist),
        authorizationMiddleware([PassportStrategy.google]),
        selectionistsController.putSelectionist
    )

    router.delete(
        /*
           #swagger.tags = ['v1-Selectionists']
           #swagger.description = 'Delete selectionist.'
           #swagger.parameters['body'] = {
               in: 'body',
               schema: { "$ref": "#/definitions/v1DeleteSelectionistReqBody" }
           }
           #swagger.responses[200] = {
               schema: { "$ref": "#/definitions/v1DeleteSelectionistRes" }
           }
       */
        '/:selectionistID',
        validationMiddleware(SelectionistController.schemas.request.deleteSelectionist),
        authorizationMiddleware([PassportStrategy.google]),
        selectionistsController.deleteSelectionist
    )

    return router
}