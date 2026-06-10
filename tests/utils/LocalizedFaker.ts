import { Faker, en, de, sk, uk } from '@faker-js/faker';

import { Language } from '../../src/utils/enums';

export default class LocalizedFaker {
    private static readonly instances: Record<Language, Faker>
        = Object.fromEntries(Object.values(Language).map((language) => [
            language,
            new Faker({
                locale: [LocalizedFaker.getLocale(language)]
            })
        ])) as Record<Language, Faker>;

    private static getLocale(language: Language) {
        switch (language) {
        case Language.en:
            return en;
    
        case Language.ua:
            return uk;
    
        case Language.de:
            return de;
    
        case Language.sk:
            return sk;

        default:
            return en;
        }
    }

    public static get(language: Language): Faker {
        return this.instances[language];
    }
}