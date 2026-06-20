import { Router } from 'express'

import { AddressController } from '../../controllers/v1/AddressController'
import authorizationMiddleware from '../../middlewares/authorizationMiddleware'
import validationMiddleware from '../../middlewares/validationMiddleware'
import { PassportStrategy } from '../../utils/enums'

const router = Router()
const addressController = new AddressController()

export default function addressRouter() {
    router.get(
        /*
            #swagger.tags = ['v1-Addresses']
            #swagger.description = 'Get user addresses.'
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetAddressesRes" }
            }
        */
        '/addresses',
        validationMiddleware(AddressController.schemas.request.getAddresses),
        authorizationMiddleware([PassportStrategy.google]),
        addressController.getAddresses
    )

    router.put(
        /*
            #swagger.tags = ['v1-Addresses']
            #swagger.description = 'Create or update address.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PutAddressReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PutAddressRes" }
            }
        */
        '/addresses',
        validationMiddleware(AddressController.schemas.request.putAddress),
        authorizationMiddleware([PassportStrategy.google]),
        addressController.putAddress
    )

    router.delete(
        /*
            #swagger.tags = ['v1-Addresses']
            #swagger.description = 'Delete address.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1DeleteAddressReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1DeleteAddressRes" }
            }
        */
        '/addresses/:addressID',
        validationMiddleware(AddressController.schemas.request.deleteAddress),
        authorizationMiddleware([PassportStrategy.google]),
        addressController.deleteAddress
    )

    return router
}