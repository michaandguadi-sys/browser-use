import type { FilmProps } from './theme';

const de = {
	readyIn: 'Video fertig in',
	ready: 'Video fertig.',
	steps: ['Rohmaterial', 'Schnitt', 'Feedback', 'Ebenen', 'Export'],
	file: 'Folge_12',
	pin: 'Szene kürzen',
	done: 'Erledigt',
	export: 'Export',
	cta: 'Erstgespräch buchen',
	tracks: ['Titel', 'B-Roll', 'Video', 'Untertitel', 'Musik', 'SFX'],
	title: 'Folge 12',
	subtitle: 'Der Vergleich',
	caption: 'Einmal entschieden. In jeder Folge.',
	data: ['Tempo', 'Klarheit', 'Rhythmus'],
};
const en: typeof de = {
	readyIn: 'Video ready in',
	ready: 'Video ready.',
	steps: ['Raw footage', 'Cut', 'Feedback', 'Layers', 'Export'],
	file: 'Episode_12',
	pin: 'Trim this scene',
	done: 'Done',
	export: 'Export',
	cta: 'Book an intro call',
	tracks: ['Titles', 'B-roll', 'Video', 'Captions', 'Music', 'SFX'],
	title: 'Episode 12',
	subtitle: 'The comparison',
	caption: 'Decided once. In every episode.',
	data: ['Pace', 'Clarity', 'Rhythm'],
};
export const t = (lang: FilmProps['lang']) => (lang === 'en' ? en : de);
