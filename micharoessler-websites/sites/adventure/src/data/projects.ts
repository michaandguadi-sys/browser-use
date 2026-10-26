import type { ImageMetadata } from 'astro';

const img = import.meta.glob<{ default: ImageMetadata }>('../assets/img/*.jpg', { eager: true });
export const pic = (name: string): ImageMetadata => {
	const hit = img[`../assets/img/${name}.jpg`];
	if (!hit) throw new Error(`missing image ${name}`);
	return hit.default;
};

type L = { en: string; de: string };

export type Project = {
	slug: string;
	title: L;
	kicker: L; // category line
	year: string;
	location: L;
	roles: L;
	client?: string;
	summary: L;
	body: L[];
	facts: { label: L; value: L }[];
	cover: string;
	gallery: string[];
	youtube?: string;
	featured?: boolean;
	peak?: string; // shown at the top of the altitude rail
	galleryCredit?: string; // photographer of the gallery stills, when documented
};

// Facts only from micharoessler.com (2024), Notion work pages and Drive briefings.
// Do not add summits, clients or numbers that are not documented.
export const projects: Project[] = [
	{
		slug: 'bolivia-andes',
		title: { en: 'Andes Expedition, Bolivia', de: 'Anden-Expedition, Bolivien' },
		kicker: { en: 'Expedition film', de: 'Expeditionsfilm' },
		year: '2024',
		location: { en: 'Sajama region, Bolivia', de: 'Sajama-Region, Bolivien' },
		roles: { en: 'Camera, drone, direction', de: 'Kamera, Drohne, Regie' },
		client: 'Hydraid (brand partner)',
		summary: {
			en: 'Four weeks in the high Andes: thin air, different cultures and the attempt at a first 6,000 m peak, filmed for an upcoming documentary.',
			de: 'Vier Wochen in den Hochanden: dünne Luft, andere Kulturen und der Versuch, den ersten 6.000er zu besteigen – gedreht für eine kommende Dokumentation.',
		},
		body: [
			{
				en: 'In August 2024 I travelled to the Sajama region of Bolivia with a small team. The goal was to understand the culture of the Altiplano and to attempt my first 6,000 m peak. The mountain set the rules: weather, altitude and the body decide, not the plan.',
				de: 'Im August 2024 bin ich mit einem kleinen Team in die Sajama-Region Boliviens gereist. Ziel war es, die Kultur des Altiplano zu verstehen und meinen ersten 6.000er zu versuchen. Die Regeln hat der Berg gemacht: Wetter, Höhe und Körper entscheiden, nicht der Plan.',
			},
			{
				en: 'Brand partner Hydraid briefed a cinematic mountaineering piece plus vertical reels and stills, so every shot had to work for two formats at once. The footage below is a selection for the documentary, which is still in the edit.',
				de: 'Markenpartner Hydraid hat einen cineastischen Bergfilm plus Hochkant-Reels und Fotos gebrieft – jede Einstellung musste also für zwei Formate funktionieren. Die Bilder unten sind eine Auswahl für die Dokumentation, die sich noch im Schnitt befindet.',
			},
		],
		facts: [
			{ label: { en: 'Duration', de: 'Dauer' }, value: { en: '4 weeks, Aug 2024', de: '4 Wochen, Aug. 2024' } },
			{ label: { en: 'Altitude', de: 'Höhe' }, value: { en: 'High Andes, 4,000 m+', de: 'Hochanden, 4.000 m+' } },
			{ label: { en: 'Deliverables', de: 'Lieferumfang' }, value: { en: 'Doc footage, reels, stills', de: 'Doku-Material, Reels, Fotos' } },
		],
		peak: '4,000 m+',
		cover: 'bolivia-twin-volcanoes',
		gallery: [
			'bolivia-ridge-climbers',
			'bolivia-sunrise-hiker',
			'bolivia-summit-view',
			'bolivia-crater-1',
			'bolivia-ridge-vertical',
			'bolivia-crater-2',
			'bolivia-plateau',
			'bolivia-snowfield',
			'bolivia-river',
		],
		featured: true,
	},
	{
		slug: 'drivers-eye-24h-nurburgring',
		title: { en: 'Drivers Eye – 24h Nürburgring', de: 'Drivers Eye – 24h Nürburgring' },
		kicker: { en: 'Documentary', de: 'Dokumentation' },
		year: '2021',
		location: { en: 'Nürburgring Nordschleife, Germany', de: 'Nürburgring Nordschleife' },
		roles: { en: 'Camera, edit, direction', de: 'Kamera, Schnitt, Regie' },
		client: 'Felix von der Laden',
		summary: {
			en: 'A 4K behind-the-scenes documentary from inside one of the hardest endurance races in the world.',
			de: 'Eine 4K-Doku hinter den Kulissen eines der härtesten Langstreckenrennen der Welt.',
		},
		body: [
			{
				en: 'For Felix von der Laden I filmed and edited “Drivers Eye | 4K Doku | 24h Rennen Nürburgring Nordschleife”. The film follows the team through 24 hours of adrenaline, precision and fatigue, from the grid to the moments when things go wrong.',
				de: 'Für Felix von der Laden habe ich „Drivers Eye | 4K Doku | 24h Rennen Nürburgring Nordschleife“ gedreht und geschnitten. Der Film begleitet das Team durch 24 Stunden Adrenalin, Präzision und Erschöpfung – vom Start bis zu den Momenten, in denen etwas schiefgeht.',
			},
			{
				en: 'Endurance storytelling works the same on a racetrack and on a mountain: you stay with the people when it gets hard, and you build the edit around what it cost them.',
				de: 'Ausdauer-Storytelling funktioniert auf der Rennstrecke wie am Berg: Man bleibt bei den Menschen, wenn es hart wird, und baut den Schnitt um das, was es sie gekostet hat.',
			},
		],
		facts: [
			{ label: { en: 'Views', de: 'Aufrufe' }, value: { en: '1.4 million on YouTube', de: '1,4 Mio. auf YouTube' } },
			{ label: { en: 'Format', de: 'Format' }, value: { en: 'Long-form documentary, 4K', de: 'Langform-Doku, 4K' } },
		],
		cover: 'drivers-eye-cover',
		gallery: [],
		youtube: '7Kt9NFOXqF4',
		featured: true,
	},
	{
		slug: 'hotrodtour-cologne-ibiza',
		title: { en: 'Hotrodtour – Cologne to Ibiza', de: 'Hotrodtour – Köln bis Ibiza' },
		kicker: { en: 'Road-trip documentary', de: 'Roadtrip-Doku' },
		year: '',
		location: { en: 'Germany → France → Spain', de: 'Deutschland → Frankreich → Spanien' },
		roles: { en: 'Camera, edit, direction', de: 'Kamera, Schnitt, Regie' },
		client: 'Felix von der Laden',
		summary: {
			en: '13 days, a convoy of mini hot rods and a crew of creators driving from Cologne to Ibiza.',
			de: '13 Tage, ein Konvoi aus Mini-Hotrods und eine Crew aus Creators auf dem Weg von Köln nach Ibiza.',
		},
		body: [
			{
				en: 'Felix von der Laden and a group of creators drove mini hot rods from Cologne to Ibiza. I directed, filmed and edited the documentary: the landscapes, the group dynamics and the constant repairs that made the trip what it was.',
				de: 'Felix von der Laden und eine Gruppe Creators sind mit Mini-Hotrods von Köln nach Ibiza gefahren. Ich habe die Doku inszeniert, gedreht und geschnitten: die Landschaften, die Gruppendynamik und die ständigen Reparaturen, die den Trip ausgemacht haben.',
			},
		],
		facts: [
			{ label: { en: 'Shooting days', de: 'Drehtage' }, value: { en: '13', de: '13' } },
			{ label: { en: 'Views', de: 'Aufrufe' }, value: { en: '1.2 million on YouTube', de: '1,2 Mio. auf YouTube' } },
		],
		cover: 'hotrodtour-cover',
		gallery: [],
		youtube: 'ER8HBwDKMGw',
		featured: true,
	},
	{
		slug: 'kilimanjaro',
		title: { en: 'Kilimanjaro', de: 'Kilimandscharo' },
		kicker: { en: 'Short documentaries', de: 'Kurzdokus' },
		year: '2023',
		location: { en: 'Rongai route, Tanzania', de: 'Rongai-Route, Tansania' },
		roles: { en: 'Camera, edit, direction', de: 'Kamera, Schnitt, Regie' },
		summary: {
			en: 'Six days to the roof of Africa, filmed from inside the group: the raw moments, not the postcard.',
			de: 'Sechs Tage aufs Dach Afrikas, gefilmt aus der Gruppe heraus: die rohen Momente, nicht die Postkarte.',
		},
		body: [
			{
				en: 'In February 2023 I climbed Kilimanjaro via the Rongai route with a group of five and filmed the ascent as a series of short documentaries. Seven shooting days, one camera bag and the discipline to keep filming when everyone else just wants to sleep.',
				de: 'Im Februar 2023 habe ich den Kilimandscharo über die Rongai-Route mit einer Fünfergruppe bestiegen und den Aufstieg als Serie kurzer Dokus gefilmt. Sieben Drehtage, ein Kamerarucksack und die Disziplin, weiterzufilmen, wenn alle anderen nur noch schlafen wollen.',
			},
		],
		facts: [
			{ label: { en: 'Shooting days', de: 'Drehtage' }, value: { en: '7', de: '7' } },
			{ label: { en: 'Summit', de: 'Gipfel' }, value: { en: 'Uhuru Peak, 5,895 m', de: 'Uhuru Peak, 5.895 m' } },
		],
		peak: '5,895 m',
		cover: 'kilimanjaro-ridge',
		gallery: [],
	},
	{
		slug: 'moroccan-sahara',
		title: { en: '24 Hours in the Sahara', de: '24 Stunden in der Sahara' },
		kicker: { en: 'YouTube production', de: 'YouTube-Produktion' },
		year: '2023',
		location: { en: 'Moroccan Sahara', de: 'Marokkanische Sahara' },
		roles: { en: 'Camera operator', de: 'Kameramann' },
		client: 'Fabian Baggeler',
		summary: {
			en: 'Camera for “24 hours surviving in the Sahara Desert” with creator Fabian Baggeler.',
			de: 'Kamera für „24 Stunden überleben in der Sahara“ mit Creator Fabian Baggeler.',
		},
		body: [
			{
				en: 'Two shooting days in the Moroccan Sahara as camera operator for Fabian Baggeler’s survival format: heat, sand in every seal and light that changes every ten minutes.',
				de: 'Zwei Drehtage in der marokkanischen Sahara als Kameramann für Fabian Baggelers Survival-Format: Hitze, Sand in jeder Dichtung und Licht, das sich alle zehn Minuten ändert.',
			},
		],
		facts: [{ label: { en: 'Shooting days', de: 'Drehtage' }, value: { en: '2', de: '2' } }],
		cover: 'sahara-dunes',
		gallery: ['sahara-lone-walker', 'sahara-mesa-vertical', 'sahara-dusk-dunes', 'sahara-flag-plain'],
		galleryCredit: 'Fabian Baggeler',
	},
	{
		slug: 'bleibe-floating-hotel',
		title: { en: 'Bleibe', de: 'Bleibe' },
		kicker: { en: 'Hospitality film', de: 'Hotel- & Destinationsfilm' },
		year: '',
		location: { en: 'Lakeside, aerial & ground', de: 'Am See, Luft & Boden' },
		roles: { en: 'Camera, drone, edit', de: 'Kamera, Drohne, Schnitt' },
		client: 'Bleibe',
		summary: {
			en: 'A floating stay, filmed from the water, the shore and the air, cut for web and vertical social.',
			de: 'Eine schwimmende Unterkunft, gefilmt vom Wasser, vom Ufer und aus der Luft – geschnitten für Web und Hochkant-Social.',
		},
		body: [
			{
				en: 'Your place and its surroundings are your strongest story. For Bleibe I filmed sunrise to dusk, drone and ground, and delivered landscape films plus vertical cuts for social.',
				de: 'Dein Ort und seine Umgebung sind deine stärkste Geschichte. Für Bleibe habe ich von Sonnenaufgang bis Dämmerung gedreht, Drohne und Boden, und Querformat-Filme plus Hochkant-Schnitte für Social geliefert.',
			},
		],
		facts: [{ label: { en: 'Formats', de: 'Formate' }, value: { en: '16:9 + 9:16', de: '16:9 + 9:16' } }],
		cover: 'bleibe-sunset',
		gallery: ['bleibe-aerial-dock', 'bleibe-coast-vertical', 'bleibe-aerial-wide', 'bleibe-dusk', 'bleibe-lake'],
	},
];

// As listed by Micha on micharoessler.com ("And much more!" page, 2024).
export const brands = ['Red Bull Germany', 'AEVOR', 'Hydraid', 'Sushi Bikes', 'Autohero', 'Carwow', 'AI Hub Frankfurt'];
export const creators = ['Felix von der Laden', 'Fabian Baggeler', 'Jonas Moll', 'Simon Will', 'Qris'];
