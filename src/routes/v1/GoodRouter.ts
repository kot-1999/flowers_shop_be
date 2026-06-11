import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { GoodController } from '../../controllers/v1/GoodController';
import authorizationMiddleware from '../../middlewares/authorizationMiddleware';
import permissionMiddleware from '../../middlewares/permissionMiddleware';
import validationMiddleware from '../../middlewares/validationMiddleware';
import { PassportStrategy } from '../../utils/enums';

const router = Router();
const goodsController = new GoodController();

export default function goodsRouter() {
    router.get(
        /*
            #swagger.tags = ['v1-Goods']
            #swagger.description = 'Get goods.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetGoodsReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetGoodsRes" }
            }
        */
        '/goods',
        validationMiddleware(GoodController.schemas.request.getGoods),
        goodsController.getGoods
    );

    router.get(
        /*
            #swagger.tags = ['v1-Goods']
            #swagger.description = 'Get single good.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1GetGoodReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1GetGoodRes" }
            }
        */
        '/goods/:goodID',
        validationMiddleware(GoodController.schemas.request.getGood),
        goodsController.getGood
    );

    router.post(
        /*
            #swagger.tags = ['v1-Goods']
            #swagger.description = 'Create good.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PostGoodReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PostGoodRes" }
            }
        */
        '/admin/goods',
        validationMiddleware(GoodController.schemas.request.postGood),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        goodsController.postGood
    );

    router.patch(
        /*
            #swagger.tags = ['v1-Goods']
            #swagger.description = 'Update good.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1PatchGoodReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1PatchGoodRes" }
            }
        */
        '/admin/goods/:goodID',
        validationMiddleware(GoodController.schemas.request.patchGood),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        goodsController.patchGood
    );

    router.delete(
        /*
            #swagger.tags = ['v1-Goods']
            #swagger.description = 'Delete good.'
            #swagger.parameters['body'] = {
                in: 'body',
                schema: { "$ref": "#/definitions/v1DeleteGoodReqBody" }
            }
            #swagger.responses[200] = {
                schema: { "$ref": "#/definitions/v1DeleteGoodRes" }
            }
        */
        '/admin/goods/:goodID',
        validationMiddleware(GoodController.schemas.request.deleteGood),
        authorizationMiddleware([PassportStrategy.google]),
        permissionMiddleware([UserRole.Admin]),
        goodsController.deleteGood
    );

    return router;
}