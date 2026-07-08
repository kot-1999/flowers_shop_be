import config from 'config'
import Stripe from 'stripe'

import logger from './Logger'
import { IConfig } from '../types/config'

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

    public async createPaymentIntent(
        amount: number,
        currency: string,
        metadata?: Record<string, string>
    ) {
        return this.stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: {
                enabled: true
            },
            metadata
        })
    }

    // public async retrievePaymentIntent(id: string) {
    //     return this.stripe.paymentIntents.retrieve(id)
    // }

    // public async createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
    //     return this.stripe.checkout.sessions.create(params)
    // }
    //
    // public constructWebhookEvent(
    //     payload: Buffer,
    //     signature: string
    // ) {
    //     return this.stripe.webhooks.constructEvent(
    //         payload,
    //         signature,
    //         this.stripeConfig.webhookSecret
    //     )
    // }
}

const stripeConfig = config.get<IConfig['stripe']>('stripe')
const stripeService = new StripeService(stripeConfig)

export default stripeService

// switch (err.type) {
//     case 'StripeCardError':
//         // A declined card error
//         console.log('Status:', err.statusCode);
//         console.log('Code:', err.code);
//         if (err.decline_code) console.log('Decline code:', err.decline_code);
//         if (err.param) console.log('Param:', err.param);
//         console.log('Message:', err.message);
//         console.log('Request ID:', err.requestId);
//         break;
//     case 'StripeRateLimitError':
//         // Too many requests made to the API too quickly
//         console.log('Request ID:', err.requestId);
//         break;
//     case 'StripeInvalidRequestError':
//         // Invalid parameters were supplied to Stripe's API
//         console.log('Message:', err.message);
//         if (err.param) console.log('Param:', err.param);
//         console.log('Request ID:', err.requestId);
//         break;
//     case 'StripeAPIError':
//         // An error occurred internally with Stripe's API
//         console.log('Request ID:', err.requestId);
//         break;
//     case 'StripeConnectionError':
//         // Some kind of error occurred during the HTTPS communication
//         console.log('Request ID:', err.requestId);
//         break;
//     case 'StripeAuthenticationError':
//         // You probably used an incorrect API key
//         console.log('Request ID:', err.requestId);
//         break;
//     default:
//         if (err instanceof stripe.errors.StripeError) {
//             // All other Stripe errors
//             console.log('Status: ' + err.statusCode);
//             console.log('Code: ' + err.code);
//             console.log('Message: ' + err.message);
//             console.log('Request ID: ' + err.requestId);
//         } else {
//             // Handle any other types of unexpected errors
//             throw err;
//         }
//         break;
// }