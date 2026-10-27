import type { FilmProps } from './theme';

// Film copy, DE + EN. Plain words only — no tool names, no editing jargon.
const de = {
	q: [['Keine', 'Zeit'], ['fürs', 'Editing?']],
	hours: 'Stunden. Jede Woche. Jede Folge.',
	plus: '+ 6 h',
	tracks: ['Titel', 'Grafik', 'Szenen', 'Untertitel', 'Musik', 'Sound'],
	scene: 'Szene',
	promise: ['Wir nehmen euch', 'diese Zeit ab.'],
	b1: ['Individuelle', 'Schnitt-Systeme'],
	b1sub: ['schnell.', 'zuverlässig.', 'professionell.'],
	b2: ['Einmal einrichten.', 'Läuft jede Folge.'],
	b3: ['Mehr Zeit.', 'Weniger Kosten.', 'Höhere Qualität.'],
	end: 'Euer Format als Schnitt-System.',
	cta: 'Erstgespräch buchen',
};
const en: typeof de = {
	q: [['No', 'time'], ['for', 'editing?']],
	hours: 'Hours. Every week. Every episode.',
	plus: '+ 6 h',
	tracks: ['Titles', 'Graphics', 'Scenes', 'Captions', 'Music', 'Sound'],
	scene: 'Scene',
	promise: ['We take this time', 'off your hands.'],
	b1: ['Custom', 'editing systems'],
	b1sub: ['fast.', 'reliable.', 'professional.'],
	b2: ['Set up once.', 'Runs every episode.'],
	b3: ['More time.', 'Lower cost.', 'Higher quality.'],
	end: 'Your format as an edit system.',
	cta: 'Book an intro call',
};
export const t = (lang: FilmProps['lang']) => (lang === 'en' ? en : de);
