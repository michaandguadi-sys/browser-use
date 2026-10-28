export type Lang = 'de' | 'en';

// The site is served under a base path (/formatschnitt/, see astro.config.mjs). url() prefixes a site-relative
// path with it: url('/en/') -> '/formatschnitt/en/'. Works in .astro frontmatter and in client scripts.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (p: string) => BASE + (p.startsWith('/') ? p : `/${p}`);

// Absolute URL of the whole domain (micharoessler.com) – Formatschnitt is one section of it.
export const ORIGIN = 'https://micharoessler.com';
export const PERSON_ID = `${ORIGIN}/#person`;
export const ORG_ID = `${ORIGIN}/#organization`;
export const WEBSITE_ID = `${ORIGIN}/#website`;
export const SERVICE_ID = `${ORIGIN}${url('/')}#service`;

// Formatschnitt serves the German-speaking market (Germany, Austria, Switzerland).
export const areaServed = (lang: Lang) =>
	(lang === 'de' ? ['Deutschland', 'Österreich', 'Schweiz'] : ['Germany', 'Austria', 'Switzerland']).map((name, i) => ({
		'@type': 'Country',
		name,
		identifier: ['DE', 'AT', 'CH'][i],
	}));

const routes: Record<string, Record<Lang, string>> = {
	home: { de: '/', en: '/en/' },
	imprint: { de: '/impressum/', en: '/en/legal/' },
	privacy: { de: '/datenschutz/', en: '/en/privacy/' },
};
export type Page = keyof typeof routes;
export const href = (lang: Lang, page: Page) => url(routes[page][lang]);
export const alts = (page: Page): Record<Lang, string> => ({ de: href('de', page), en: href('en', page) });
export const other = (lang: Lang): Lang => (lang === 'de' ? 'en' : 'de');
// the main site (micharoessler.com, served at the domain root) in the matching language
export const mainHome = (lang: Lang) => (lang === 'de' ? '/de/' : '/');
