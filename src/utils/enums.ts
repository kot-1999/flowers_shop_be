import fs from 'node:fs';
import path from 'node:path';

import { Country } from '@prisma/client';

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

const LOCALES_PATH = path.resolve(process.cwd(), 'locales');

for (const language of fs.readdirSync(LOCALES_PATH)) {
    const translationPath = path.join(
        LOCALES_PATH,
        language,
        'translation.json'
    );

    if (!fs.existsSync(translationPath)) {
        continue;
    }

    const translations = JSON.parse(fs.readFileSync(translationPath, 'utf8')) as Record<string, string>;

    let modified = false;

    for (const country of Object.values(Country)) {
        if (!(country in translations)) {
            translations[country] = country;
            modified = true;
        }
    }

    if (!modified) {
        continue;
    }

    const sortedTranslations = Object.fromEntries(Object.entries(translations).sort(([a], [b]) =>
        a.localeCompare(b)));

    fs.writeFileSync(
        translationPath,
        JSON.stringify(sortedTranslations, null, 2) + '\n'
    );
}