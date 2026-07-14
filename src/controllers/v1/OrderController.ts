import { Order, OrderState } from '@prisma/client'
import { NextFunction, Response, AuthRequest } from 'express'
import Joi from 'joi'

import s3Service from '../../services/AwsS3'
import prisma from '../../services/Prisma'
import shippingService from '../../services/ShippingService'
import { JoiCommon } from '../../types/JoiCommon'
import { slugify } from '../../utils/helpers'
import { IError } from '../../utils/IError'

export class OrderController {

    private static orderSchema = JoiCommon.object.request.keys({
        query: JoiCommon.object.paginatedQuery.keys({
            search: Joi.string()
                .allow('')
                .optional(),

            state: Joi.array()
                .items(Joi.string().valid(...Object.values(OrderState)))
                .optional(),

            sortBy: Joi.string()
                .valid(
                    'createdAt',
                    'updatedAt',
                    'productsPrice',
                    'shippingPrice',
                    'state'
                )
                .default('createdAt'),

            sortOrder: Joi.string()
                .valid('asc', 'desc')
                .default('desc')
        }).required()
    })

    private static ordersResSchema = Joi.object({
        orders: Joi.array().items(Joi.object({
            id: JoiCommon.string.id,

            state: Joi.string().required(),

            productsPrice: Joi.number().required(),
            shippingPrice: Joi.number().required(),
            total: Joi.number().required(),

            createdAt: Joi.date().required(),
            updatedAt: Joi.date().required(),

            recipientFirstName: JoiCommon.string.name.required(),
            recipientLastName: JoiCommon.string.name.required(),
            recipientEmail: JoiCommon.string.email.required(),

            itemsCount: Joi.number().required(),

            addressSnapshot: JoiCommon.object.addressSnapshot.required(),

            user: Joi.object({
                id: Joi.string().required(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                email: Joi.string().email()
                    .required(),
                avatar: Joi.string().uri()
                    .allow(null)
                    .required()
            }).required()
        }))
            .required(),

        pagination: JoiCommon.object.paginationRes.required()
    })

    private static orderResSchema = Joi.object({
        order: Joi.object({
            id: Joi.string().required(),

            state: Joi.string().required(),

            productsPrice: Joi.number().required(),
            shippingPrice: Joi.number().required(),

            paymentTransactionID: Joi.string()
                .allow(null),

            shippingTransactionID: Joi.string()
                .allow(null),

            trackingNumber: Joi.string()
                .allow(null),

            trackingUrl: Joi.string()
                .allow(null),

            refundAmount: Joi.number()
                .allow(null),

            recipientFirstName: Joi.string().required(),
            recipientLastName: Joi.string().required(),
            recipientEmail: Joi.string().email()
                .required(),

            addressSnapshot: Joi.object().required(),

            createdAt: Joi.date().required(),
            updatedAt: Joi.date().required(),

            user: Joi.object({
                id: Joi.string().required(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                email: Joi.string().email()
                    .required(),
                avatar: Joi.string().uri()
                    .allow(null)
                    .required()
            }).required(),

            orderItems: Joi.array().items(Joi.object())
                .required()
        }).required()
    })

    public static schemas = {
        request: {
            getOrders: this.orderSchema,
            getAdminOrders: this.orderSchema,
            getOrder: JoiCommon.object.request.keys({
                params: Joi.object({
                    orderID: JoiCommon.string.id
                }).required()
            }),
            getAdminOrder: JoiCommon.object.request.keys({
                params: Joi.object({
                    orderID: JoiCommon.string.id
                }).required()
            }),
            patchOrder: JoiCommon.object.request.keys({
                params: Joi.object({
                    orderID: JoiCommon.string.id
                }).required()
            })
        },

        response: {
            getOrders: this.ordersResSchema,
            getAdminOrders: this.ordersResSchema,
            getOrder: this.orderResSchema,
            getAdminOrder: this.orderResSchema,
            patchOrder: Joi.object({
                order: Joi.object({
                    id: JoiCommon.string.id
                }),
                message: Joi.string().required()
            })
        }
    }

    private PatchOrderReqType: Joi.extractType<typeof OrderController.schemas.request.patchOrder>
    private PatchOrderResType: Joi.extractType<typeof OrderController.schemas.response.patchOrder>
    public patchOrder = async (
        req: AuthRequest & typeof this.PatchOrderReqType,
        res: Response<typeof this.PatchOrderResType>,
        next: NextFunction
    ) => {
        try {
            const { params } = req

            const where = {
                id: params.orderID
            }
            
            const order: Order = await prisma.order.findFirst({ where })

            if (!order) {
                throw new IError(404, req.t('Order was not found'))
            }

            if ([
                OrderState.Cancelled, 
                OrderState.Refunded, 
                OrderState.Expired, 
                OrderState.PaymentFailed, 
                OrderState.Pending, 
                OrderState.Delivered
            ].includes(order.state as any)) {
                throw new IError(403, req.t('Can not update order state'))
            }

            let message: string = ''
            let data: any = {}

            switch (order.state) {
            case OrderState.Paid:
                data.state = OrderState.Processing
                message = 'Order is processing now'
                break
            case OrderState.Processing:
                const res = await shippingService.createLabel(order.shippingRateID)

                if (res.status === 'ERROR') {
                    if (!!res.messages?.find((msg: any) => msg.code === 'carrier_request_failed')) {
                        throw new IError(500, req.t('Carrier is unavailable. Please try again in a few minutes.'))
                    }

                    throw new IError(500, req.t('Unknown carrier error'))
                }
                data = {
                    state: OrderState.Shipped,
                    shippingTransactionID: res.objectId,
                    trackingNumber: res.trackingNumber,
                    trackingUrl: res.trackingUrlProvider
                }
                message = 'Order is ready for shipping'
                break
            case OrderState.Shipped:
                data.state = OrderState.Delivered
                message = 'Order is completed'
                break
            default:
                throw new IError(400, 'Unknown order state')
            }
            
            await prisma.order({
                where,
                data
            })

            return res.status(200).send({
                order: {
                    id: order.id
                },
                message
            })
        } catch (err) {
            return next(err)
        }
    }

    private GetOrdersReqType: Joi.extractType<typeof OrderController.schemas.request.getOrders>
    private GetOrdersResType: Joi.extractType<typeof OrderController.schemas.response.getOrders>
    public getOrders = async (
        req: AuthRequest & typeof this.GetOrdersReqType,
        res: Response<typeof this.GetOrdersResType>,
        next: NextFunction
    ) => {
        return this.getOrdersCommon(req, res, next, false)
    }

    private GetAdminOrdersReqType: Joi.extractType<typeof OrderController.schemas.request.getAdminOrders>
    private GetAdminOrdersResType: Joi.extractType<typeof OrderController.schemas.response.getAdminOrders>
    public getAdminOrders = async (
        req: AuthRequest & typeof this.GetAdminOrdersReqType,
        res: Response<typeof this.GetAdminOrdersResType>,
        next: NextFunction
    ) => {
        return this.getOrdersCommon(req, res, next, true)
    }

    private async getOrdersCommon(
        req: AuthRequest & typeof this.GetOrdersReqType,
        res: Response<typeof this.GetOrdersResType>,
        next: NextFunction,
        isAdmin: boolean
    ) {
        try {
            const { query, user } = req
            const skip = (query.page - 1) * query.limit

            const where: any = {}

            if (!isAdmin) {
                where.userID = user.id
            }

            if (query.state?.length) {
                where.state = {
                    in: query.state
                }
            }

            if (query.search) {

                const terms = slugify(query.search).split('-')
                    .filter(Boolean)

                const expressions: any[] = []

                terms.forEach((term) => {
                    expressions.push({
                        recipientFirstNameSlug: {
                            contains: term
                        }
                    })
                    expressions.push({
                        recipientLastNameSlug: {
                            contains: term
                        }
                    })
                    expressions.push({
                        recipientEmail: {
                            contains: term
                        }
                    })
                    expressions.push({
                        user: {
                            firstNameSlug: {
                                contains: term
                            }
                        }
                    })
                    expressions.push({
                        user: {
                            lastNameSlug: {
                                contains: term
                            }
                        }
                    })
                    expressions.push({
                        user: {
                            email: {
                                contains: term
                            }
                        }
                    })
                })

                where.OR = expressions
            }

            const orderBy = {
                [query.sortBy]: query.sortOrder
            }

            const [orders, total] = await Promise.all([
                prisma.order.findMany({
                    where,
                    skip,
                    take: query.limit,
                    orderBy,
                    select: {
                        id: true,
                        state: true,
                        productsPrice: true,
                        shippingPrice: true,
                        recipientFirstName: true,
                        recipientLastName: true,
                        recipientEmail: true,
                        addressSnapshot: true,
                        createdAt: true,
                        updatedAt: true,

                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatar: true
                            }
                        },

                        _count: {
                            select: {
                                orderItems: true
                            }
                        }
                    }
                }),

                prisma.order.count({
                    where
                })
            ])

            return res.status(200).json({
                orders: orders.map((order: any) => ({
                    ...order,
                    total: Number((Number(order.shippingPrice) + Number(order.productsPrice)).toFixed(2)),
                    itemsCount: order._count.orderItems,
                    user: {
                        ...order.user,
                        avatar: s3Service.getPublicUrl(user.avatar)
                    }
                })),
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total
                }
            })
        } catch (err) {
            return next(err)
        }
    }

    private GetOrderReqType: Joi.extractType<typeof OrderController.schemas.request.getOrder>
    private GetOrderResType: Joi.extractType<typeof OrderController.schemas.response.getOrder>

    public getOrder = async (
        req: AuthRequest & typeof this.GetOrderReqType,
        res: Response<typeof this.GetOrderResType>,
        next: NextFunction
    ) => {
        return this.getOrderCommon(req, res, next, false)
    }

    public getAdminOrder = async (
        req: AuthRequest & typeof this.GetOrderReqType,
        res: Response<typeof this.GetOrderResType>,
        next: NextFunction
    ) => {
        return this.getOrderCommon(req, res, next, true)
    }

    private async getOrderCommon(
        req: AuthRequest & typeof this.GetOrderReqType,
        res: Response<typeof this.GetOrderResType>,
        next: NextFunction,
        isAdmin: boolean
    ) {
        try {
            const { orderID } = req.params
            const { user } = req

            const where: any = {
                id: orderID
            }

            if (!isAdmin) {
                where.userID = user.id
            }

            const order = await prisma.order.findFirst({
                where,
                select: {
                    id: true,
                    state: true,

                    createdAt: true,
                    updatedAt: true,
                    expiresAt: true,

                    productsPrice: true,
                    shippingPrice: true,

                    paymentTransactionID: true,
                    shippingTransactionID: true,

                    trackingNumber: true,
                    trackingUrl: true,
                    
                    refundAmount: true,

                    recipientFirstName: true,
                    recipientLastName: true,
                    recipientEmail: true,

                    addressSnapshot: true,

                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true
                        }
                    },

                    orderItems: {
                        select: {
                            id: true,
                            quantity: true,
                            unitPrice: true,
                            snapshot: true
                        }
                    }
                }
            })

            if (!order) {
                return next(new IError(404, req.t('Order not found')))
            }

            return res.status(200).json({
                order: {
                    ...order,
                    user: {
                        ...order.user,
                        avatar: s3Service.getPublicUrl(user.avatar)
                    },
                    orderItems: order.orderItems.map((item: any) => {
                        const snapshot = item.snapshot

                        return {
                            id: item.id,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,

                            snapshot: {
                                ...snapshot,
                                photo: snapshot.photos?.length
                                    ? s3Service.getPublicUrl(snapshot.photos[0])
                                    : null
                            }
                        }
                    })
                }
            })
        } catch (err) {
            return next(err)
        }
    }
}