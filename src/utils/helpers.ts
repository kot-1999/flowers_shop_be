import { Language } from './enums';

export const translationSelect = Object.fromEntries(Object.values(Language).map((lang) => [lang, true]));

export function slugify(textInput: string): string {
    return textInput
        .toLowerCase()
        .replace(/[^a-zа-яіїєґ0-9\s-]/giu, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
}