import { NextFunction, Request, Response } from 'express'

import { Language } from '../utils/enums'

export default function languageMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const acceptLanguage = req.headers['accept-language']

    if (
        !acceptLanguage
        || !Object.values(Language).includes(acceptLanguage as Language)
    ) {
        req.headers['accept-language'] = Language.en
    }

    next()
}