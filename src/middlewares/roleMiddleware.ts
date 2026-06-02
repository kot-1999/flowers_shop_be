import { UserRole } from '@prisma/client';
import { NextFunction, OptionalAuthRequest } from 'express';

import { IError } from '../utils/IError';

export default function roleMiddleware(allowedRoles: UserRole[]) {
    return (req: OptionalAuthRequest, res: Response, next: NextFunction) => {
        const { user } = req

        if (!user) {
            return next(new IError(401, 'Unauthorized'))
        }

        // Allow NotRegistered always if included
        if (allowedRoles.includes(UserRole.NotRegistered)) {
            return next()
        }

        if (!allowedRoles.includes(user.role)) {
            return next(new IError(403, 'Forbidden'))
        }

        return next()
    }
}