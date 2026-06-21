import { Country } from '@prisma/client'
import dayjs from 'dayjs'
import { AuthRequest, NextFunction, Response } from 'express'
import Joi from 'joi'

import prisma from '../../services/Prisma'
import { AbstractController } from '../../types/AbstractController'
import { JoiCommon } from '../../types/JoiCommon'
import { IError } from '../../utils/IError'

export class AddressController extends AbstractController {
    private static readonly addressSchema = Joi.object({
        id: JoiCommon.string.id.required(),

        apartment: Joi.string()
            .allow(null),

        building: Joi.string().required(),
        street: Joi.string().required(),
        city: Joi.string().required(),
        postcode: Joi.string().required(),

        country: Joi.string()
            .valid(...Object.values(Country))
            .required(),

        isDefault: Joi.boolean()
            .required(),

        createdAt: Joi.date().iso()
            .required(),

        updatedAt: Joi.date().iso()
            .required()
    })

    public static readonly schemas = {
        request: {
            getAddresses: JoiCommon.object.request.required(),

            putAddress: JoiCommon.object.request.keys({
                body: Joi.object({
                    addressID: JoiCommon.string.id.optional(),

                    apartment: Joi.string()
                        .allow(null)
                        .optional(),

                    building: Joi.string(),
                    street: Joi.string(),
                    city: Joi.string(),
                    postcode: Joi.string(),

                    country: Joi.string()
                        .valid(...Object.values(Country)),

                    isDefault: Joi.boolean().optional()
                })
                    .or('addressID', 'building')
                    .when(Joi.object({ addressID: Joi.exist() }).unknown(), {
                        then: Joi.object(),
                        otherwise: Joi.object({
                            building: Joi.required(),
                            street: Joi.required(),
                            city: Joi.required(),
                            postcode: Joi.required(),
                            country: Joi.required()
                        })
                    })
                    .required()
            }),

            deleteAddress: JoiCommon.object.request.keys({
                params: Joi.object({
                    addressID: JoiCommon.string.id.required()
                }).required()
            })
        },

        response: {
            getAddresses: Joi.object({
                addresses: Joi.array()
                    .items(this.addressSchema)
                    .required()
            }),

            putAddress: Joi.object({
                address: Joi.object({
                    id: JoiCommon.string.id.required()
                }).required(),

                message: Joi.string().required()
            }),

            deleteAddress: Joi.object({
                message: Joi.string().required()
            })
        }
    }

    constructor() {
        super()
    }

    private GetAddressesReqType: Joi.extractType<typeof AddressController.schemas.request.getAddresses>
    private GetAddressesResType: Joi.extractType<typeof AddressController.schemas.response.getAddresses>
    public async getAddresses(
        req: AuthRequest & typeof this.GetAddressesReqType,
        res: Response<typeof this.GetAddressesResType>,
        next: NextFunction
    ) {
        try {
            const { user } = req

            const addresses = await prisma.address.findMany({
                where: {
                    userID: user.id,
                    deletedAt: null
                },
                orderBy: [
                    { isDefault: 'desc' },
                    { createdAt: 'desc' }
                ],
                select: {
                    id: true,
                    apartment: true,
                    building: true,
                    street: true,
                    city: true,
                    postcode: true,
                    country: true,
                    isDefault: true,
                    createdAt: true,
                    updatedAt: true
                }
            })

            return res.status(200).json({
                addresses
            })
        } catch (err) {
            return next(err)
        }
    }

    private PutAddressReqType: Joi.extractType<typeof AddressController.schemas.request.putAddress>
    private PutAddressResType: Joi.extractType<typeof AddressController.schemas.response.putAddress>
    public async putAddress(
        req: AuthRequest & typeof this.PutAddressReqType,
        res: Response<typeof this.PutAddressResType>,
        next: NextFunction
    ) {
        try {
            const { body, user } = req

            let existingAddress: { id: string } | null = null

            // If updating existing address
            if (body.addressID) {
                existingAddress = await prisma.address.findFirst({
                    where: {
                        id: body.addressID,
                        userID: user.id,
                        deletedAt: null
                    },
                    select: {
                        id: true
                    }
                })

                if (!existingAddress) {
                    throw new IError(404, req.t('Address not found'))
                }
            }

            const address = await prisma.$transaction(async (tx: any) => {
                // If creating new address → enforce limit
                if (!body.addressID) {
                    const addressesCount = await tx.address.count({
                        where: {
                            userID: user.id,
                            deletedAt: null
                        }
                    })

                    if (addressesCount >= 10) {
                        const oldestAddress = await tx.address.findFirst({
                            where: {
                                userID: user.id,
                                deletedAt: null,
                                isDefault: false
                            },
                            orderBy: {
                                updatedAt: 'asc'
                            },
                            select: {
                                id: true
                            }
                        })

                        if (!oldestAddress) {
                            throw new IError(403, req.t('Maximum number of addresses reached'))
                        }

                        await tx.address.update({
                            where: {
                                id: oldestAddress.id
                            },
                            data: {
                                deletedAt: dayjs().toISOString()
                            }
                        })
                    }
                }

                // reset defaults if needed
                if (body.isDefault) {
                    await tx.address.updateMany({
                        where: {
                            userID: user.id,
                            deletedAt: null
                        },
                        data: {
                            isDefault: false
                        }
                    })
                }

                const data = {
                    ...body,
                    addressID: body.addressID
                }

                delete data?.addressID

                // create or update
                if (body.addressID) {
                    return await tx.address.update({
                        where: {
                            id: body.addressID
                        },
                        data,
                        select: {
                            id: true
                        }
                    })
                }

                return await tx.address.create({
                    data: {
                        ...data,
                        userID: user.id
                    },
                    select: {
                        id: true
                    }
                })
            })

            return res.status(200).json({
                address: {
                    id: address.id
                },
                message: body.addressID
                    ? req.t('Address updated')
                    : req.t('Address created')
            })
        } catch (err) {
            return next(err)
        }
    }

    private DeleteAddressReqType: Joi.extractType<typeof AddressController.schemas.request.deleteAddress>
    private DeleteAddressResType: Joi.extractType<typeof AddressController.schemas.response.deleteAddress>
    public async deleteAddress(
        req: AuthRequest & typeof this.DeleteAddressReqType,
        res: Response<typeof this.DeleteAddressResType>,
        next: NextFunction
    ) {
        try {
            const { params, user } = req

            const address = await prisma.address.findFirst({
                where: {
                    id: params.addressID,
                    userID: user.id,
                    deletedAt: null
                },
                select: {
                    id: true
                }
            })

            if (!address) {
                throw new IError(404, req.t('Address not found'))
            }

            await prisma.address.update({
                where: {
                    id: address.id
                },
                data: {
                    deletedAt: dayjs().toISOString()
                }
            })

            return res.status(200).json({
                message: req.t('Address deleted')
            })
        } catch (err) {
            return next(err)
        }
    }
}