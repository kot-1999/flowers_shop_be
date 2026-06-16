import { Language } from './enums'

export const translationSelect = {
    id: true,
    ...Object.fromEntries(Object.values(Language).map((lang) => [lang, true]))
}

export function slugify(text: string): string {
    return text
        .normalize('NFD') // split accents
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .toLowerCase()
        .replace(/ß/g, 'ss')
        // KEEP Cyrillic + Latin + numbers + spaces
        .replace(/[^a-z0-9а-яіїєґ\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}