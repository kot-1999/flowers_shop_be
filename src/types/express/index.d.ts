import { User } from '@prisma/client'
import { Request as OriginalRequest } from 'express'

declare module 'express' {
    interface Request extends OriginalRequest {
        body: {}
        query: {}
        params: {}
    }

    interface AuthRequest extends Request {
        user: User
    }

    interface OptionalAuthRequest extends Request {
        user?: User
    }
}