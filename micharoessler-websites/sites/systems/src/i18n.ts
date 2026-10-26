export type Lang = 'de' | 'en';

const routes: Record<string, Record<Lang, string>> = {
	home: { de: '/', en: '/en/' },
	imprint: { de: '/impressum/', en: '/en/legal/' },
	privacy: { de: '/datenschutz/', en: '/en/privacy/' },
};
export const href = (lang: Lang, page: keyof typeof routes) => routes[page][lang];
export const other = (lang: Lang): Lang => (lang === 'de' ? 'en' : 'de');
