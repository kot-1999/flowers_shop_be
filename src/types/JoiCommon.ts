import Joi from 'joi'

import { Constants } from '../utils/Constants'
import { Language, Languages } from '../utils/enums'

export class JoiCommon {
    static readonly string = {
        id: Joi.string().uuid()
            .required(),
        name: Joi.string()
            .trim()
            .pattern(/^[a-zA-Z0-9\s'&.,-]+$/)
            .min(Constants.number.MIN_NAME_LENGTH)
            .max(Constants.number.MAX_STRING_LENGTH)
            .required(),
        companyName: Joi.string().min(5)
            .max(200)
            .required(),
        email: Joi.string().email()
            .trim()
            .case('lower'),
        token: Joi.string()

    }

    static readonly number = {

    }

    static readonly object = {
        request: Joi.object({
            query: Joi.object(),
            body: Joi.object(),
            params: Joi.object(),
            headers: Joi.object()
        }),

        singleTranslation: Joi.object()
            .pattern(
                Joi.string().valid(...Object.values(Language)),
                Joi.string().required()
            )
            .min(1)
            .required(),

        singleTranslationWithSlug: Joi.object(Object.fromEntries([
            ...Languages.map((lang) => [lang, Joi.string()]),
            ...Languages.map((lang) => [`${lang}Slug`, Joi.string()])
        ]))
            .pattern(
                Joi.string().valid(
                    ...Languages,
                    ...Languages.map((lang) => `${lang}Slug`)
                ),
                Joi.string()
            )
            .or(...Languages) // at least one language value
            .or(...Languages.map((lang) => `${lang}Slug`)) // at least one slug
            .min(2)
            .max(Languages.length * 2),

        translationsWithSlug: Joi.object(Object.fromEntries(Object.values(Language).flatMap((lang) => [
            [lang, Joi.string().required()],
            [`${lang}Slug`, Joi.string().required()]
        ]))),

        address: Joi.object({
            building: Joi.string().trim()
                .min(1)
                .required(),

            street: Joi.string().trim()
                .min(1)
                .required(),

            city: Joi.string().trim()
                .min(1)
                .required(),

            postcode: Joi.string().trim()
                .min(1)
                .required(),

            country: Joi.string().trim()
                .min(1)
                .required()

        }),

        paginatedQuery: Joi.object({
            page: Joi.number()
                .integer()
                .min(1)
                .default(1),

            limit: Joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(20)
        }),

        paginationRes: Joi.object({
            page: Joi.number()
                .integer()
                .min(1)
                .required(),

            limit: Joi.number()
                .integer()
                .min(1)
                .max(100)
                .required(),

            total: Joi.number()
                .integer()
                .min(0)
                .required()
        }),

        translations: Joi.object(Object.fromEntries(Object.values(Language).map((lang) => [
            lang,
            Joi.string().required()
        ])))
    }
}