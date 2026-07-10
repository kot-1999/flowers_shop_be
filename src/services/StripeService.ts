import {Order, OrderItem, OrderState} from '@prisma/client'
import config from 'config'
import { TFunction } from 'i18next'
import Stripe from 'stripe'

import logger from './Logger'
import { IConfig } from '../types/config'
import { StripeMetadata } from '../types/types'
import { IError } from '../utils/IError'

interface StripeErrorType {
    type: string
    statusCode?: number
    code?: string
    decline_code?: string
    param?: string
    message: string
    requestId?: string
}

class StripeService {
    private readonly stripe: Stripe
    private readonly stripeConfig: IConfig['stripe']

    constructor(stripeConfig: IConfig['stripe']) {
        this.stripeConfig = stripeConfig

        this.stripe = new Stripe(this.stripeConfig.config.apiSecret, {
            apiVersion: '2026-06-24.dahlia'
        })
        logger.info('Stripe service started')
    }

    public get client() {
        return this.stripe
    }

    public async getOrCreateCustomer(
        firstName: string,
        lastName: string,
        email: string,
        t: TFunction
    ) {
        try {
            const customers = await this.stripe.customers.list({
                email,
                limit: 1
            })

            if (customers.data.length > 0) {
                return customers.data[0]
            }

            return await this.stripe.customers.create({
                name: `${firstName} ${lastName}`,
                email
            })
        } catch (err) {
            this.handleStripeError(err as StripeErrorType, t)
        }
    }

    public async createInvoice(
        order: Order & { orderItems: OrderItem[] },
        t: TFunction
    ) {
        try {
            const customer = await this.getOrCreateCustomer(
                order.recipientFirstName,
                order.recipientLastName,
                order.recipientEmail,
                t
            )

            const invoice = await this.stripe.invoices.create({
                customer: customer.id,
                auto_advance: false,
                collection_method: 'send_invoice',
                days_until_due: 0,
                metadata: {
                    orderID: order.id,
                    userID: order.userID,
                    paymentIntentID: order.paymentTransactionID ?? ''
                }
            })

            for (const item of order.orderItems) {
                const snapshot: any = item.snapshot

                await this.stripe.invoiceItems.create({
                    customer: customer.id,
                    invoice: invoice.id,
                    unit_amount_decimal: (Math.round(Number(item.unitPrice) * 100)).toString() as any,
                    quantity: item.quantity,
                    currency: 'gbp',
                    description: `${snapshot.name.en} - ${snapshot.itemType.name.en}`
                })
            }

            if (Number(order.shippingPrice) > 0) {
                await this.stripe.invoiceItems.create({
                    customer: customer.id,
                    invoice: invoice.id,
                    amount: Math.round(Number(order.shippingPrice) * 100),
                    currency: 'gbp',
                    description: 'Shipping'
                })
            }

            const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id)

            return await this.stripe.invoices.pay(finalizedInvoice.id, {
                paid_out_of_band: order.state !== OrderState.Pending && order.state !== OrderState.PaymentFailed
            })
        } catch (err) {
            this.handleStripeError(err as StripeErrorType, t)
        }
    }

    public async createPaymentIntent(
        amount: number,
        currency: string,
        metadata: StripeMetadata,
        t: TFunction
    ) {
        try {
            return await this.stripe.paymentIntents.create({
                amount,
                currency,
                automatic_payment_methods: {
                    enabled: true
                },
                metadata
            })
        } catch (err) {
            this.handleStripeError(err as StripeErrorType, t)
        }
    }

    public async retrievePaymentIntent(id: string, t: TFunction) {
        try {
            return await this.stripe.paymentIntents.retrieve(id)
        } catch (err) {
            this.handleStripeError(err as StripeErrorType, t)
        }
    }

    public async createCheckoutSession(
        params: Stripe.Checkout.SessionCreateParams,
        t: (key: string) => string
    ) {
        try {
            return await this.stripe.checkout.sessions.create(params)
        } catch (err) {
            this.handleStripeError(err as StripeErrorType, t)
        }
    }

    public constructWebhookEvent(
        payload: string,
        signature: string,
        t: (key: string) => string
    ): Stripe.Event & { data: { object: { metadata?: StripeMetadata } }} {
        try {
            return this.stripe.webhooks.constructEvent(
                payload,
                signature,
                this.stripeConfig.config.webhookSecret
            ) as Stripe.Event & {
                data: {
                    object: {
                        metadata?: StripeMetadata
                    }
                }
            }
        } catch (err) {
            this.handleStripeError(err as StripeErrorType, t)
        }
    }

    public async createRefund(
        paymentIntentID: string,
        amount: number | undefined,
        reason: Stripe.RefundCreateParams.Reason,
        t: TFunction
    ) {
        try {
            return await this.stripe.refunds.create({
                payment_intent: paymentIntentID,
                amount,
                reason
            })
        } catch (err) {
            this.handleStripeError(err as StripeErrorType, t)
        }
    }

    private handleStripeError(
        err: StripeErrorType | any,
        t: (key: string) => string
    ): never {

        switch (err.type) {
        case 'StripeCardError':
            logger.error('Card declined', {
                statusCode: err.statusCode,
                code: err.code,
                declineCode: err.decline_code,
                param: err.param,
                requestId: err.requestId
            })
            throw new IError(400, t('Card declined'))

        case 'StripeRateLimitError':
            logger.error('Stripe rate limit exceeded', {
                requestId: err.requestId
            })
            throw new IError(429, t('Payment service rate limit exceeded'))

        case 'StripeInvalidRequestError':
            console.log('Invalid request', {
                message: err.message,
                param: err.param,
                code: err.code,
                requestId: err.requestId
            })
            logger.error('Invalid request', {
                message: err.message,
                param: err.param,
                requestId: err.requestId
            })
            throw new IError(400, t('Invalid payment request'))

        case 'StripeAPIError':
            logger.error('Stripe API error', {
                requestId: err.requestId,
                message: err.message
            })
            throw new IError(500, t('Payment service API error'))

        case 'StripeConnectionError':
            logger.error('Connection error to Stripe', {
                requestId: err.requestId,
                message: err.message
            })
            throw new IError(503, t('Connection error to payment service'))

        case 'StripeAuthenticationError':
            logger.error('Stripe authentication error', {
                requestId: err.requestId
            })
            throw new IError(401, t('Payment authentication error'))

        default:
            if (err instanceof this.stripe.errors.StripeError) {
                logger.error('Stripe error', {
                    statusCode: err.statusCode,
                    code: err.code,
                    message: err.message,
                    requestId: err.requestId
                })
                throw new IError(500, t('errors.payment.stripeError'))
            } else {
                logger.error('Unexpected error in Stripe service', {
                    message: err.message,
                    stack: err.stack
                })
                throw new IError(500, t('Unexpected error in payment service'))
            }
        }
    }
}

const stripeConfig = config.get<IConfig['stripe']>('stripe')
const stripeService = new StripeService(stripeConfig)

export default stripeService