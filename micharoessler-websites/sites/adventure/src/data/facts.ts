// "In short" on the About page (and in /llms.txt): a quotable fact list. Every line restates something already
// on this site (About, Home field log, projects) – no new facts.
import type { Lang } from '../i18n';

export const factsOf = (lang: Lang): [string, string][] =>
	lang === 'en'
		? [
				['Name', 'Micha Rössler (also written Micha Roessler)'],
				['What I do', 'Expedition & adventure filmmaker, camera operator and documentary editor'],
				['From', 'A small village in Bavaria, Germany – on the road full-time since 2024'],
				['Known for', 'Drivers Eye – 24h Nürburgring (1.4M views), Hotrodtour (1.2M views), Andes expedition in Bolivia (2024)'],
				['Highest shoot', 'Kilimanjaro summit, 5,895 m'],
				['Languages', 'German · English'],
				['Company', 'Micha Roessler LLC (USA) – you always deal with me directly'],
				['Also', 'Formatschnitt – editing systems for company YouTube shows'],
				['Contact', 'hello@micharoessler.com – reply within two working days'],
			]
		: [
				['Name', 'Micha Rössler (auch Micha Roessler)'],
				['Was ich mache', 'Expeditions- & Outdoor-Filmemacher, Kameramann und Dokumentarfilm-Cutter'],
				['Herkunft', 'Ein kleines Dorf in Bayern – seit 2024 dauerhaft unterwegs'],
				['Bekannt für', 'Drivers Eye – 24h Nürburgring (1,4 Mio. Aufrufe), Hotrodtour (1,2 Mio. Aufrufe), Anden-Expedition in Bolivien (2024)'],
				['Höchster Dreh', 'Kilimandscharo-Gipfel, 5.895 m'],
				['Sprachen', 'Deutsch · Englisch'],
				['Firma', 'Micha Roessler LLC (USA) – ihr habt immer direkt mit mir zu tun'],
				['Außerdem', 'Formatschnitt – Schnitt-Systeme für YouTube-Formate von Unternehmen'],
				['Kontakt', 'hello@micharoessler.com – Antwort innerhalb von zwei Werktagen'],
			];
