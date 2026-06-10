import { Language } from './enums';

export const translationSelect = Object.fromEntries(Object.values(Language).map((lang) => [lang, true]));

export function slugify(text: string): string {
    return text
        .normalize('NFD') // split letters + accents
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .toLowerCase()
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
}