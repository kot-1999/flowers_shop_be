import { UserRole } from '@prisma/client';
import { AuthRequest, NextFunction, Response } from 'express'

import { IError } from '../utils/IError'

export default function permissionMiddleware(allowedRoles: UserRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { user } = req
            
            if (!user || !allowedRoles.includes(user.role)) {
                throw new IError(403, req.t('Permission forbidden'))
            }

            return next()
        } catch {
            throw new IError(403, req.t('Permission forbidden'))
        }
    }
}