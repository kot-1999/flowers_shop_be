import { faker } from '@faker-js/faker'

export const categories = [
    {
        name: {
            id: faker.string.uuid(),
            en: 'Violets',
            ua: 'Фіалки',
            sk: 'Fialky',
            de: 'Veilchen'
        },
        description: {
            id: faker.string.uuid(),
            en: 'Selection of best African violets',
            ua: 'Вибір найкращих фіалок',
            sk: 'Výber najlepších afrických fialiek',
            de: 'Auswahl der besten Afrikanischen Veilchen'
        }
    },
    {
        name: {
            id: faker.string.uuid(),
            en: 'Peonies',
            ua: 'Півонії',
            sk: 'Pivonky',
            de: 'Pfingstrosen'
        },
        description: {
            id: faker.string.uuid(),
            en: 'Elegant selection of premium peonies',
            ua: 'Вишуканий вибір преміальних півоній',
            sk: 'Elegantný výber prémiových pivoniek',
            de: 'Elegante Auswahl an Premium-Pfingstrosen'
        }
    },
    {
        name: {
            id: faker.string.uuid(),
            en: 'Irises',
            ua: 'Іриси',
            sk: 'Kosatce',
            de: 'Iris'
        },
        description: {
            id: faker.string.uuid(),
            en: 'Beautiful irises in a variety of colors',
            ua: 'Красиві іриси різноманітних кольорів',
            sk: 'Krásne kosatce v rôznych farbách',
            de: 'Wunderschöne Iris in verschiedenen Farben'
        }
    },
    {
        name: {
            id: faker.string.uuid(),
            en: 'Пеліргонії',
            ua: 'Орхідеї',
            sk: 'Orchidey',
            de: 'Orchideen'
        },
        description: {
            id: faker.string.uuid(),
            en: 'Exotic orchids for refined interiors',
            ua: 'Екзотичні орхідеї для вишуканих інтер’єрів',
            sk: 'Exotické orchidey pre elegantné interiéry',
            de: 'Exotische Orchideen für stilvolle Innenräume'
        }
    },
    {
        name: {
            id: faker.string.uuid(),
            en: 'Lilies',
            ua: 'Лілії',
            sk: 'Ľalie',
            de: 'Lilien'
        },
        description: {
            id: faker.string.uuid(),
            en: 'Fragrant lilies perfect for any occasion',
            ua: 'Ароматні лілії для будь-якої нагоди',
            sk: 'Voňavé ľalie vhodné na každú príležitosť',
            de: 'Duftende Lilien für jeden Anlass'
        }
    },
    {
        name: {
            id: faker.string.uuid(),
            en: 'Succulents',
            ua: 'Сукуленти',
            sk: 'Sukulenty',
            de: 'Sukkulenten'
        },
        description: {
            id: faker.string.uuid(),
            en: 'Low-maintenance succulents for modern spaces',
            ua: 'Невибагливі сукуленти для сучасних просторів',
            sk: 'Nenáročné sukulenty pre moderné priestory',
            de: 'Pflegeleichte Sukkulenten für moderne Räume'
        }
    }
]
export const itemTypes = [
    {
        name: {
            id: faker.string.uuid(),
            en: 'Young Plant',
            ua: 'Молода рослина',
            sk: 'Mladá rastlina',
            de: 'Junge Pflanze'
        },
        weight: 30
    },
    {
        name: {
            id: faker.string.uuid(),
            en: 'Leaf',
            ua: 'Листок',
            sk: 'List',
            de: 'Blatt'
        },
        weight: 5
    },
    {
        name: {
            id: faker.string.uuid(),
            en: 'Mature Plant',
            ua: 'Доросла рослина',
            sk: 'Dospelá rastlina',
            de: 'Ausgewachsene Pflanze'
        },
        weight: 150
    },
    {
        name: {
            id: faker.string.uuid(),
            en: 'Rhizome',
            ua: 'Кореневище',
            sk: 'Podzemok',
            de: 'Rhizom'
        },
        weight: 200
    },
    {
        name: {
            id: faker.string.uuid(),
            en: 'Cutting',
            ua: 'Щепка',
            sk: 'Odrezok',
            de: 'Steckling'
        },
        weight: 100
    }
]