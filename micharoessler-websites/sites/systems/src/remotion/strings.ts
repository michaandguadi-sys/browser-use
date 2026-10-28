import type { FilmProps } from './theme';

// Film copy, DE + EN (social / OG use; the page itself tells the story live). Plain words only — no tool names,
// no editing jargon. Kept in sync with src/data/content.ts → hero.
const de = {
	q: [['Keine', 'Zeit'], ['fürs', 'Editing?']],
	hours: 'Stunden. Jede Woche. Jede Folge.',
	plus: '+ 6 h',
	tracks: ['Titel', 'Grafik', 'Szenen', 'Untertitel', 'Musik', 'Sound'],
	scene: 'Szene',
	promise: ['Ich nehme', 'euch das ab.'],
	b1: ['Individuelle', 'Schnitt-Systeme'],
	b1sub: [] as string[],
	b2: ['Einmal einrichten.', 'Läuft jede Folge.'],
	b3: ['Mehr Zeit.', 'Weniger Kosten.', 'Höhere Qualität.'],
	end: 'Euer Format. Ohne eure Schnittzeit.',
	cta: 'Erstgespräch anfragen',
};
const en: typeof de = {
	q: [['No', 'time'], ['for', 'editing?']],
	hours: 'Hours. Every week. Every episode.',
	plus: '+ 6 h',
	tracks: ['Titles', 'Graphics', 'Scenes', 'Captions', 'Music', 'Sound'],
	scene: 'Scene',
	promise: ['I’ll take it', 'off your plate.'],
	b1: ['Custom', 'editing systems'],
	b1sub: [],
	b2: ['Set up once.', 'Every episode follows.'],
	b3: ['More time.', 'Lower cost.', 'Higher quality.'],
	end: 'Your show. Without the editing hours.',
	cta: 'Request an intro call',
};
export const t = (lang: FilmProps['lang']) => (lang === 'en' ? en : de);
