import { Language } from './enums';

export const translationSelect = Object.fromEntries(Object.values(Language).map((lang) => [lang, true]));