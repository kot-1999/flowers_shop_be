import fs from 'node:fs'
import path from 'node:path'

import { Country } from '@prisma/client'

export enum PassportStrategy {
    google = 'google',
    jwtUserForgotPassword = 'jwt-user-forgot_password',
    jwtAdminForgotPassword = 'jwt-admin-forgot_password',
}

export enum EmailType {
    forgotPassword = 'forgotPassword',
    registered = 'registered'
}

export enum JwtAudience {
    userForgotPassword = 'userfps',
    adminForgotPassword = 'adminfps'
}

export enum NodeEnv {
    Dev = 'dev',
    Prod = 'prod',
    Test = 'test',
}

export enum Language {
    en = 'en',
    ua = 'ua',
    sk = 'sk',
    de = 'de'
}
export const Languages = Object.values(Language) as Language[]

const LOCALES_PATH = path.resolve(process.cwd(), 'locales')

export enum TaxType {
    // EIN = 'EIN',
    VAT = 'VAT',
    IOSS = 'IOSS',
    // ARN = 'ARN'
}
export const ShippingCountry: Record<
    Country,
    { taxType: TaxType; countryCode: string }
> = {
    [Country.UnitedKingdom]: {
        taxType: TaxType.VAT,
        countryCode: 'GB'
    },
    [Country.Austria]: {
        taxType: TaxType.VAT,
        countryCode: 'AT'
    },
    [Country.Belgium]: {
        taxType: TaxType.IOSS,
        countryCode: 'BE'
    },
    [Country.Bulgaria]: {
        taxType: TaxType.IOSS,
        countryCode: 'BG'
    },
    [Country.Croatia]: {
        taxType: TaxType.IOSS,
        countryCode: 'HR'
    },
    [Country.Cyprus]: {
        taxType: TaxType.IOSS,
        countryCode: 'CY'
    },
    [Country.CzechRepublic]: {
        taxType: TaxType.IOSS,
        countryCode: 'CZ'
    },
    [Country.Denmark]: {
        taxType: TaxType.IOSS,
        countryCode: 'DK'
    },
    [Country.Estonia]: {
        taxType: TaxType.IOSS,
        countryCode: 'EE'
    },
    [Country.Finland]: {
        taxType: TaxType.IOSS,
        countryCode: 'FI'
    },
    [Country.France]: {
        taxType: TaxType.VAT,
        countryCode: 'FR'
    },
    [Country.Germany]: {
        taxType: TaxType.VAT,
        countryCode: 'DE'
    },
    [Country.Greece]: {
        taxType: TaxType.IOSS,
        countryCode: 'GR'
    },
    [Country.Hungary]: {
        taxType: TaxType.IOSS,
        countryCode: 'HU'
    },
    [Country.Ireland]: {
        taxType: TaxType.VAT,
        countryCode: 'IE'
    },
    [Country.Italy]: {
        taxType: TaxType.VAT,
        countryCode: 'IT'
    },
    [Country.Latvia]: {
        taxType: TaxType.IOSS,
        countryCode: 'LV'
    },
    [Country.Lithuania]: {
        taxType: TaxType.IOSS,
        countryCode: 'LT'
    },
    [Country.Luxembourg]: {
        taxType: TaxType.IOSS,
        countryCode: 'LU'
    },
    [Country.Malta]: {
        taxType: TaxType.VAT,
        countryCode: 'MT'
    },
    [Country.Netherlands]: {
        taxType: TaxType.VAT,
        countryCode: 'NL'
    },
    [Country.Poland]: {
        taxType: TaxType.IOSS,
        countryCode: 'PL'
    },
    [Country.Portugal]: {
        taxType: TaxType.IOSS,
        countryCode: 'PT'
    },
    [Country.Romania]: {
        taxType: TaxType.IOSS,
        countryCode: 'RO'
    },
    [Country.Slovakia]: {
        taxType: TaxType.IOSS,
        countryCode: 'SK'
    },
    [Country.Slovenia]: {
        taxType: TaxType.IOSS,
        countryCode: 'SI'
    },
    [Country.Spain]: {
        taxType: TaxType.VAT,
        countryCode: 'ES'
    },
    [Country.Sweden]: {
        taxType: TaxType.IOSS,
        countryCode: 'SE'
    },

    [Country.Albania]: {
        taxType: TaxType.VAT,
        countryCode: 'AL'
    },
    [Country.Andorra]: {
        taxType: TaxType.VAT,
        countryCode: 'AD'
    },
    [Country.Armenia]: {
        taxType: TaxType.VAT,
        countryCode: 'AM'
    },
    [Country.Azerbaijan]: {
        taxType: TaxType.VAT,
        countryCode: 'AZ'
    },
    [Country.BosniaAndHerzegovina]: {
        taxType: TaxType.VAT,
        countryCode: 'BA'
    },
    [Country.Georgia]: {
        taxType: TaxType.VAT,
        countryCode: 'GE'
    },
    [Country.Iceland]: {
        taxType: TaxType.VAT,
        countryCode: 'IS'
    },
    [Country.Kosovo]: {
        taxType: TaxType.VAT,
        countryCode: 'XK'
    },
    [Country.Liechtenstein]: {
        taxType: TaxType.VAT,
        countryCode: 'LI'
    },
    [Country.Moldova]: {
        taxType: TaxType.VAT,
        countryCode: 'MD'
    },
    [Country.Monaco]: {
        taxType: TaxType.VAT,
        countryCode: 'MC'
    },
    [Country.Montenegro]: {
        taxType: TaxType.VAT,
        countryCode: 'ME'
    },
    [Country.NorthMacedonia]: {
        taxType: TaxType.VAT,
        countryCode: 'MK'
    },
    [Country.Norway]: {
        taxType: TaxType.VAT,
        countryCode: 'NO'
    },
    [Country.SanMarino]: {
        taxType: TaxType.VAT,
        countryCode: 'SM'
    },
    [Country.Serbia]: {
        taxType: TaxType.VAT,
        countryCode: 'RS'
    },
    [Country.Switzerland]: {
        taxType: TaxType.VAT,
        countryCode: 'CH'
    },
    [Country.Turkey]: {
        taxType: TaxType.VAT,
        countryCode: 'TR'
    },
    [Country.Ukraine]: {
        taxType: TaxType.VAT,
        countryCode: 'UA'
    },
    [Country.VaticanCity]: {
        taxType: TaxType.VAT,
        countryCode: 'VA'
    },

    [Country.Canada]: {
        taxType: TaxType.VAT,
        countryCode: 'CA'
    },
    [Country.China]: {
        taxType: TaxType.VAT,
        countryCode: 'CN'
    },
    [Country.HongKong]: {
        taxType: TaxType.VAT,
        countryCode: 'HK'
    },
    [Country.India]: {
        taxType: TaxType.VAT,
        countryCode: 'IN'
    },
    [Country.Israel]: {
        taxType: TaxType.VAT,
        countryCode: 'IL'
    },
    [Country.Japan]: {
        taxType: TaxType.VAT,
        countryCode: 'JP'
    },
    [Country.Kazakhstan]: {
        taxType: TaxType.VAT,
        countryCode: 'KZ'
    },
    [Country.Malaysia]: {
        taxType: TaxType.VAT,
        countryCode: 'MY'
    },
    [Country.NewZealand]: {
        taxType: TaxType.VAT,
        countryCode: 'NZ'
    },
    [Country.Singapore]: {
        taxType: TaxType.VAT,
        countryCode: 'SG'
    },
    [Country.SouthKorea]: {
        taxType: TaxType.VAT,
        countryCode: 'KR'
    },
    [Country.Taiwan]: {
        taxType: TaxType.VAT,
        countryCode: 'TW'
    },
    [Country.Thailand]: {
        taxType: TaxType.VAT,
        countryCode: 'TH'
    },
    [Country.UnitedArabEmirates]: {
        taxType: TaxType.VAT,
        countryCode: 'AE'
    },

    [Country.Argentina]: {
        taxType: TaxType.VAT,
        countryCode: 'AR'
    },
    [Country.Brazil]: {
        taxType: TaxType.VAT,
        countryCode: 'BR'
    },
    [Country.Chile]: {
        taxType: TaxType.VAT,
        countryCode: 'CL'
    },
    [Country.Colombia]: {
        taxType: TaxType.VAT,
        countryCode: 'CO'
    },
    [Country.Mexico]: {
        taxType: TaxType.VAT,
        countryCode: 'MX'
    },
    [Country.Paraguay]: {
        taxType: TaxType.VAT,
        countryCode: 'PY'
    },
    [Country.Peru]: {
        taxType: TaxType.VAT,
        countryCode: 'PE'
    },
    [Country.Uruguay]: {
        taxType: TaxType.VAT,
        countryCode: 'UY'
    },

    [Country.Egypt]: {
        taxType: TaxType.VAT,
        countryCode: 'EG'
    },
    [Country.Morocco]: {
        taxType: TaxType.VAT,
        countryCode: 'MA'
    },
    [Country.SouthAfrica]: {
        taxType: TaxType.VAT,
        countryCode: 'ZA'
    }
    // [Country.Australia]: {
    //     taxType: TaxType.ARN,
    //     countryCode: 'AU'
    // },
    // [Country.UnitedStates]: {
    //     taxType: TaxType.EIN,
    //     countryCode: 'US'
    // }
}

for (const language of fs.readdirSync(LOCALES_PATH)) {
    const translationPath = path.join(
        LOCALES_PATH,
        language,
        'translation.json'
    )

    if (!fs.existsSync(translationPath)) {
        continue
    }

    const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8')) as Record<string, string>

    let modified = false

    for (const country of Object.values(Country)) {
        if (!(country in translations)) {
            translations[country] = country
            modified = true
        }
    }

    if (!modified) {
        continue
    }

    const sortedTranslations = Object.fromEntries(Object.entries(translations).sort(([a], [b]) =>
        a.localeCompare(b)))

    fs.writeFileSync(
        translationPath,
        JSON.stringify(sortedTranslations, null, 2) + '\n'
    )
}