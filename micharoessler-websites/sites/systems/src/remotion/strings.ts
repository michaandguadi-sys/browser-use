import type { FilmProps } from './theme';

const de = {
	readyIn: 'Video fertig in',
	ready: 'Video fertig.',
	steps: ['Material', 'Schnitt', 'Feedback', 'Feinschliff', 'Fertig'],
	file: 'Folge 12',
	pin: 'Szene kürzen',
	done: 'Erledigt',
	export: 'Wird fertig',
	cta: 'Erstgespräch buchen',
	tracks: ['Titel', 'Grafik', 'Szenen', 'Untertitel', 'Musik', 'Sound'],
	scene: 'Szene',
	formats: ['Quer', 'Hoch'],
	title: 'Folge 12',
	subtitle: 'Der Vergleich',
	caption: 'Einmal entschieden. In jeder Folge.',
	data: ['Tempo', 'Klarheit', 'Rhythmus'],
};
const en: typeof de = {
	readyIn: 'Video ready in',
	ready: 'Video ready.',
	steps: ['Footage', 'Cut', 'Feedback', 'Polish', 'Ready'],
	file: 'Episode 12',
	pin: 'Trim this scene',
	done: 'Done',
	export: 'Finishing',
	cta: 'Book an intro call',
	tracks: ['Titles', 'Graphics', 'Scenes', 'Captions', 'Music', 'Sound'],
	scene: 'Scene',
	formats: ['Landscape', 'Vertical'],
	title: 'Episode 12',
	subtitle: 'The comparison',
	caption: 'Decided once. In every episode.',
	data: ['Pace', 'Clarity', 'Rhythm'],
};
export const t = (lang: FilmProps['lang']) => (lang === 'en' ? en : de);
