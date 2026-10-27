// Timeline as written on the About page (moved here unchanged so Home's logbook can reuse it).
import type { Lang } from '../i18n';

export const timelineOf = (lang: Lang): [string, string][] => {
	const en = lang === 'en';
	return en
		? [
				['2021', 'Drivers Eye – 24h Nürburgring documentary for Felix von der Laden: camera, edit, direction. 1.4M views.'],
				['2023', 'Winter hike to Trolltunga, Norway. Kilimanjaro via the Rongai route. Glacier tour on the Großvenediger (3,660 m). Sahara shoot with Fabian Baggeler.'],
				['2024', 'Four weeks in the Bolivian Andes for an upcoming documentary, with brand partner Hydraid. Start of full-time life on the road.'],
				['2025–26', 'Travel films with Guada as Guadi & Micha across Asia and the Americas. Format editing for brands like Carwow.'],
				['2027', 'Planned: Laponia midwinter ski traverse, Lyngen Alps, Arctic Circle Trail.'],
			]
		: [
				['2021', 'Drivers Eye – 24h-Nürburgring-Doku für Felix von der Laden: Kamera, Schnitt, Regie. 1,4 Mio. Aufrufe.'],
				['2023', 'Winterwanderung zur Trolltunga, Norwegen. Kilimandscharo über die Rongai-Route. Gletschertour am Großvenediger (3.660 m). Sahara-Dreh mit Fabian Baggeler.'],
				['2024', 'Vier Wochen in den bolivianischen Anden für eine kommende Doku, mit Markenpartner Hydraid. Beginn des Lebens auf Reisen.'],
				['2025–26', 'Reisefilme mit Guada als Guadi & Micha in Asien und Amerika. Format-Schnitt für Marken wie Carwow.'],
				['2027', 'Geplant: Laponia-Skidurchquerung im Hochwinter, Lyngen-Alpen, Arctic Circle Trail.'],
			];
};
