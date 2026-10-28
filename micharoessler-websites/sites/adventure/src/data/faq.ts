// FAQ: the questions are new copy (to be approved by Micha). Each answer opens with one short, direct sentence
// (so it can be quoted on its own – search snippets, AI answers) restating a fact from this site, followed by one of
// his existing strings, verbatim, from the page named in `from`.
import { projects } from './projects';

type L = { en: string; de: string };
const bleibe = projects.find((p) => p.slug === 'bleibe-floating-hotel')!;
const lead = (first: L, rest: L): L => ({ en: `${first.en} ${rest.en}`, de: `${first.de} ${rest.de}` });

export const faq: { q: L; a: L; from: string }[] = [
	{
		q: { en: 'Can you keep filming at altitude?', de: 'Kannst du auch in der Höhe weiterdrehen?' },
		a: lead({ en: 'Yes – my highest shoot so far was the Kilimanjaro summit at 5,895 m.', de: 'Ja – mein bisher höchster Dreh war der Kilimandscharo-Gipfel auf 5.895 m.' }, {
			en: 'An expedition camera has to carry its own weight. I travel full-time, I am used to long days in cold and thin air, and I plan the shoot around the objective – never the other way round.',
			de: 'Eine Expeditionskamera muss ihr eigenes Gewicht tragen. Ich reise dauerhaft, bin lange Tage in Kälte und dünner Luft gewohnt und plane den Dreh um das Ziel herum – nie umgekehrt.',
		}),
		from: 'Home · In the field',
	},
	{
		q: { en: 'Who will I actually work with?', de: 'Mit wem arbeite ich eigentlich zusammen?' },
		a: lead({ en: 'With me, Micha Rössler, directly.', de: 'Direkt mit mir, Micha Rössler.' }, {
			en: 'No agency, no account manager. When you write, I answer – and I am the one carrying the camera up the mountain and sitting in the edit afterwards.',
			de: 'Keine Agentur, kein Account-Manager. Wenn du schreibst, antworte ich – und ich bin derjenige, der die Kamera auf den Berg trägt und danach im Schnitt sitzt.',
		}),
		from: 'Home · Hi, I am Micha',
	},
	{
		q: { en: 'What do you shoot on?', de: 'Womit drehst du?' },
		a: lead({ en: 'I shoot on Sony cameras plus drone and FPV:', de: 'Ich drehe mit Sony-Kameras, Drohne und FPV:' }, { en: 'Sony A7S III · A7 IV, drone, FPV', de: 'Sony A7S III · A7 IV, Drohne, FPV' }),
		from: 'Home · In the field (Kit)',
	},
	{
		q: { en: 'Do you deliver vertical cuts for social?', de: 'Lieferst du auch Hochkant-Schnitte für Social?' },
		a: lead({ en: 'Yes – landscape 16:9 for web and vertical 9:16 cuts for social.', de: 'Ja – 16:9 fürs Web und Hochkant-Schnitte in 9:16 für Social.' }, bleibe.body[0]),
		from: 'Project · Bleibe',
	},
	{
		q: { en: 'Which languages, and how do you invoice?', de: 'Welche Sprachen, und wie rechnest du ab?' },
		a: lead({ en: 'German and English; I invoice through Micha Roessler LLC.', de: 'Deutsch und Englisch; abgerechnet wird über Micha Roessler LLC.' }, {
			en: 'Practical bits, because you will wonder: I am German, I work in German and English, and I invoice through my own US company, Micha Roessler LLC, because I work on the road full-time. You always deal with me directly.',
			de: 'Ganz praktisch, weil die Frage sowieso kommt: Ich bin Deutscher, arbeite auf Deutsch und Englisch und rechne über meine eigene US-Firma Micha Roessler LLC ab, weil ich dauerhaft unterwegs arbeite. Ihr habt immer direkt mit mir zu tun.',
		}),
		from: 'About',
	},
	{
		q: { en: 'How fast do you reply?', de: 'Wie schnell antwortest du?' },
		a: lead({ en: 'Within two working days.', de: 'Innerhalb von zwei Werktagen.' }, {
			en: 'Tell me where, when and what you need. I answer within two working days.',
			de: 'Schreib mir wo, wann und was du brauchst. Ich antworte innerhalb von zwei Werktagen.',
		}),
		from: 'Contact',
	},
];
