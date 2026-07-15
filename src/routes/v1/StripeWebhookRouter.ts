import express, { Request, Response, NextFunction, Router } from 'express'

import { StripeWebhookController } from '../../controllers/v1/StripeWebhookController'

const router = Router()
const stripeWebhookController = new StripeWebhookController()

export default function stripeWebhookRouter() {
    router.post(
        /*
            #swagger.tags = ['v1-Webhooks']
            #swagger.description = 'Stripe webhook endpoint to handle payment events.'
            #swagger.responses[200] = {
                schema: { "received": true }
            }
        */
        '/webhooks',
        express.raw({ type: 'application/json' }),
        (req: Request, res: Response, next: NextFunction) =>
            stripeWebhookController.handleWebhook(req as any, res, next)
    )

    return router
}