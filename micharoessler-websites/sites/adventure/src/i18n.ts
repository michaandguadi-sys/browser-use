export type Lang = 'en' | 'de';
export const langs: Lang[] = ['en', 'de'];

// Route map: logical page -> localized path. Keeps both languages' URLs in one place.
const routes: Record<string, Record<Lang, string>> = {
	home: { en: '/', de: '/de/' },
	work: { en: '/work/', de: '/de/work/' },
	about: { en: '/about/', de: '/de/ueber-mich/' },
	contact: { en: '/contact/', de: '/de/kontakt/' },
	imprint: { en: '/imprint/', de: '/de/impressum/' },
	privacy: { en: '/privacy/', de: '/de/datenschutz/' },
};

export const href = (lang: Lang, page: keyof typeof routes | string): string => {
	if (page in routes) return routes[page][lang];
	// project slugs
	return lang === 'en' ? `/work/${page}/` : `/de/work/${page}/`;
};

export const other = (lang: Lang): Lang => (lang === 'en' ? 'de' : 'en');

// Formatschnitt (editing systems for company YouTube shows) – a section of this domain, built from sites/systems.
export const formatschnitt = (lang: Lang) => (lang === 'de' ? '/formatschnitt/' : '/formatschnitt/en/');

// Structured-data @ids shared by both sections of micharoessler.com (one entity graph).
export const ORIGIN = 'https://micharoessler.com';
export const PERSON_ID = `${ORIGIN}/#person`;
export const ORG_ID = `${ORIGIN}/#organization`;
export const WEBSITE_ID = `${ORIGIN}/#website`;
export const SERVICE_ID = `${ORIGIN}/formatschnitt/#service`;

export const ui = {
	en: {
		nav: { work: 'Work', about: 'About', contact: 'Contact' },
		role: 'Expedition & adventure filmmaker',
		cta: 'Plan a shoot',
		watch: 'Watch',
		viewFilm: 'View project',
		allWork: 'All work',
		next: 'Next project',
		role_l: 'Role',
		client_l: 'Client',
		location_l: 'Location',
		year_l: 'Year',
		imprint: 'Imprint',
		privacy: 'Privacy',
		switch: 'Deutsch',
		fs: 'Formatschnitt – editing systems',
		skip: 'Skip to content',
	},
	de: {
		nav: { work: 'Projekte', about: 'Über mich', contact: 'Kontakt' },
		role: 'Expeditions- & Outdoor-Filmemacher',
		cta: 'Dreh anfragen',
		watch: 'Ansehen',
		viewFilm: 'Projekt ansehen',
		allWork: 'Alle Projekte',
		next: 'Nächstes Projekt',
		role_l: 'Rolle',
		client_l: 'Kunde',
		location_l: 'Ort',
		year_l: 'Jahr',
		imprint: 'Impressum',
		privacy: 'Datenschutz',
		switch: 'English',
		fs: 'Formatschnitt',
		skip: 'Zum Inhalt springen',
	},
} as const;
