import { OrderState } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import { TFunction } from 'i18next'

import logger from '../../services/Logger'
import prisma from '../../services/Prisma'
import stripeService from '../../services/StripeService'
import { IError } from '../../utils/IError'

interface StripeWebhookRequest extends Request {
    rawBody: Buffer
    t: TFunction
}

export class StripeWebhookController {
    public async handleWebhook(
        req: StripeWebhookRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const signature = req.headers['stripe-signature'] as string

            if (!signature) {
                throw new IError(400, req.t('Missing stripe signature'))
            }

            const event = stripeService.constructWebhookEvent(
                req.body as any,
                signature,
                req.t
            )
            const { metadata } = event.data.object

            if (!metadata || !metadata.userID || !metadata.orderID) {
                throw new IError(500, 'Metadata is missing userID or orderID')
            }

            const [user, order] = await Promise.all([
                prisma.user.findFirst({
                    where: {
                        id: metadata.userID
                    },
                    select: {
                        id: true
                    }
                }),
                prisma.user.findFirst({
                    where: {
                        id: metadata.orderID,
                        userID: metadata.userID
                    },
                    select: {
                        id: true,
                        status: true,
                        expiresAt: true
                    }
                })
            ])

            if (!user) {
                throw new IError(400, 'User not found')
            }

            if (!order) {
                throw new IError(400, 'Order not found')
            }

            switch (event.type) {
            case 'payment_intent.succeeded':
                await prisma.order.update({
                    where: {
                        id: metadata.orderID,
                        userID: metadata.userID
                    },
                    data: {
                        status: OrderState.Paid
                    }
                })
                break
            case 'payment_intent.payment_failed': {
                await prisma.order.update({
                    where: {
                        id: metadata.orderID,
                        userID: metadata.userID
                    },
                    data: {
                        status: OrderState.PaymentFailed
                    }
                })
                break
            }
            case 'charge.refunded':
                await prisma.order.update({
                    where: {
                        id: metadata.orderID,
                        userID: metadata.userID
                    },
                    data: {
                        status: OrderState.Refunded
                    }
                })
                break

            default:
                logger.debug(`Unhandled webhook event type: ${event.type}`, {
                    eventId: event.id
                })
            }

            return res.status(200).json({ received: true })
        } catch (err) {
            logger.error('Webhook error', {
                message: err instanceof Error ? err.message : String(err)
            })
            return next(err)
        }
    }
}