import { Address, BasketItem, Good, ItemType, Pricing, Selectionist, Translation, User } from '@prisma/client'
import config from 'config'
import { Shippo } from 'shippo'

import { IConfig } from '../types/config'
import { ShippingCountry } from '../utils/enums'

/**
 * @class ShippingService
 * @description Wrapper around the Shippo SDK.
 * Handles client initialization and provides access to the Shippo client
 * and default shipping configuration.
 *
 * @param {IConfig['shippo']} shippoConfig - Shippo configuration.
 */
export class ShippingService {
    private readonly client: Shippo

    public readonly shippoConfig: IConfig['shippo']

    /**
     * @constructor
     * @param {IConfig['shippo']} shippoConfig - Shippo configuration.
     */
    constructor(shippoConfig: IConfig['shippo']) {
        this.shippoConfig = shippoConfig

        this.client = new Shippo({
            apiKeyHeader: this.shippoConfig.config.apiKey,
            shippoApiVersion: this.shippoConfig.config.version
        })
    }

    /**
     * @returns {Shippo} Shippo client.
     */
    public getClient(): Shippo {
        return this.client
    }

    private calculateParcelSize(totalWeight: number) {
        const baseLength = 15
        const baseWidth = 10
        const baseHeight = 10

        // Growth coefficient
        const growth = Math.cbrt(totalWeight / 100)

        return {
            length: Math.round(baseLength + growth).toString(),
            width: Math.round(baseWidth + growth * 0.75).toString(),
            height: Math.round(baseHeight + growth * 0.75).toString(),
            distanceUnit: 'cm' as const,
            weight: totalWeight.toString(),
            massUnit: 'g' as const
        }
    }

    public async createShipment(
        addressTo: Address & { user: User },
        basketItems: (BasketItem & {
            pricing: Pricing & {
                itemType: ItemType
                good: Good & {
                    name: Translation
                    selectionist: Selectionist
                }
            }
        })[]
    ) {
        const totalWeight = basketItems.reduce(
            (sum, item) =>
                sum
                + Number(item.pricing.itemType.weight) * item.quantity,
            0
        )

        return this.client.shipments.create({
            addressFrom: {
                name: this.shippoConfig.sender.name,
                company: this.shippoConfig.sender.company,
                street1: this.shippoConfig.sender.street,
                city: this.shippoConfig.sender.city,
                zip: this.shippoConfig.sender.postalCode,
                country: this.shippoConfig.sender.country,
                phone: this.shippoConfig.sender.phone,
                email: this.shippoConfig.sender.email
            },

            addressTo: {
                name: `${addressTo.user.firstName} ${addressTo.user.lastName}`,
                street1: `${addressTo.building} ${addressTo.street}`,
                street2: addressTo.apartment ?? undefined,
                city: addressTo.city,
                zip: addressTo.postcode,
                country: ShippingCountry[addressTo.country].countryCode,
                email: addressTo.user.email,
                phone: addressTo.user.phone ?? undefined
            },

            parcels: [this.calculateParcelSize(totalWeight)],

            // Do not add customs declaration for domestic
            customsDeclaration: ShippingCountry[addressTo.country].countryCode !==  this.shippoConfig.sender.country? {
                certify: this.shippoConfig.customs.certify,
                certifySigner: this.shippoConfig.customs.certifySigner,
                contentsType: this.shippoConfig.customs.contentsType,
                incoterm: this.shippoConfig.customs.incoterm,
                nonDeliveryOption: this.shippoConfig.customs.nonDeliveryOption,

                exporterIdentification: {
                    taxId: this.shippoConfig.customs.exporter.taxIDs.find((tax) => tax.type === ShippingCountry[addressTo.country].taxType)
                },

                items: basketItems.map((item) => ({
                    description: Object.values(item.pricing.good.name)[0] as string,
                    quantity: item.quantity,

                    valueAmount: item.pricing.price.toString(),
                    valueCurrency: 'EUR',

                    originCountry: ShippingCountry.UnitedKingdom.countryCode,

                    netWeight: item.pricing.itemType.weight.toString(),
                    massUnit: 'g',

                    hsCode: this.shippoConfig.customs.hsCode,
                    tariffNumber: this.shippoConfig.customs.tariffNumber
                }))
            } : undefined,

            async: false
        })
    }

    /**
     * Purchases a shipping label for the selected rate.
     */
    public async createLabel(shippingRateID: string) {
        return this.client.transactions.create({
            rate: shippingRateID,
            labelFileType: 'PDF',
            async: false
        })
    }
}

const shippoConfig = config.get<IConfig['shippo']>('shippo')

const shippingService = new ShippingService(shippoConfig)

export default shippingService