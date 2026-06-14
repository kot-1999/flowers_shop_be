import { Faker, en, de, sk, uk, faker } from '@faker-js/faker'

import { Language } from '../../src/utils/enums'

export default class LocalizedFaker {
    private static readonly instances: Record<Language, Faker>
        = Object.fromEntries(Object.values(Language).map((language) => [
            language,
            new Faker({
                locale: [LocalizedFaker.getLocale(language)]
            })
        ])) as Record<Language, Faker>

    private static getLocale(language: Language) {
        switch (language) {
        case Language.en:
            return en
    
        case Language.ua:
            return uk
    
        case Language.de:
            return de
    
        case Language.sk:
            return sk

        default:
            return en
        }
    }

    private static fallbackString(wordCount: number): string {

        let res = ''
        
        for (let i = 0; i < wordCount; i++) {
            res += faker.string.alpha({
                length: {
                    min: 4,
                    max: 9 
                }
            })
        }
        return res
    }

    public static safeCall(
        fn: Function,
        wordCount: number = 3
    ): string {
        const run = (f: Function): any => {
            try {
                return f()
            } catch {
                return null
            }
        }

        const result = run(fn)

        if (result) {
            return result
        }

        return this.fallbackString(wordCount)
    }

    public static get(language: Language): Faker {
        return this.instances[language]
    }
}