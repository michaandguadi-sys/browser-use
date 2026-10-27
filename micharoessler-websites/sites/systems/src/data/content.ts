type L = { de: string; en: string };

// Offer source: Notion "Format Edit Systems – Offer, Packages & Pitch Kit" (Oct 2026).
// Proof source: invoices / delivered files in Drive. Client names only where Micha already
// lists them publicly (Carwow on micharoessler.com); everything else stays anonymised.

export const packages: {
	id: string;
	name: L;
	price: L;
	unit: L;
	days: L;
	points: L[];
	highlight?: boolean;
}[] = [
	{
		id: 'pilot',
		name: { de: 'Bezahlter Pilot', en: 'Paid pilot' },
		price: { de: '1.950 €', en: '€1,950' },
		unit: { de: 'Festpreis', en: 'fixed' },
		days: { de: '≈ 2,6 Tage', en: '≈ 2.6 days' },
		points: [
			{ de: '1 Folge + 3 Shorts aus eurem Rohmaterial', en: '1 episode + 3 shorts from your footage' },
			{ de: 'Zeigt Qualität und Durchlaufzeit, bevor ihr euch bindet', en: 'Proves quality and turnaround before you commit' },
			{ de: '100 % anrechenbar auf den ersten Retainer-Monat', en: '100% credited to your first retainer month' },
		],
		highlight: true,
	},
	{
		id: 'setup',
		name: { de: 'Format-System Setup', en: 'Format system setup' },
		price: { de: '3.500 €', en: '€3,500' },
		unit: { de: 'einmalig', en: 'one-off' },
		days: { de: '≈ 5 Tage', en: '≈ 5 days' },
		points: [
			{ de: 'Format-Audit: Beats, Grafiken, Exporte', en: 'Format audit: beats, graphics, exports' },
			{ de: 'Projekt-Templates für Premiere oder DaVinci Resolve', en: 'Project templates for Premiere or DaVinci Resolve' },
			{ de: 'Grafik-Kit aus der Tabelle (MoGRT oder Remotion)', en: 'Spreadsheet-driven graphics kit (MoGRT or Remotion)' },
			{ de: 'Shorts-Pipeline, SOP und Übergabe-Call', en: 'Shorts pipeline, SOP and handover call' },
		],
	},
	{
		id: 'retainer-s',
		name: { de: 'Format-Retainer S', en: 'Format retainer S' },
		price: { de: '4.200 €', en: '€4,200' },
		unit: { de: 'pro Monat', en: 'per month' },
		days: { de: '6 Schnitttage', en: '6 edit days' },
		points: [
			{ de: 'z. B. 2 Langform-Folgen + 8–12 Shorts', en: 'e.g. 2 long-form episodes + 8–12 shorts' },
			{ de: 'Läuft auf eurem Format-System', en: 'Runs on your format system' },
			{ de: '3 Monate Mindestlaufzeit', en: '3-month minimum' },
		],
	},
	{
		id: 'retainer-m',
		name: { de: 'Format-Retainer M', en: 'Format retainer M' },
		price: { de: '6.750 €', en: '€6,750' },
		unit: { de: 'pro Monat', en: 'per month' },
		days: { de: '10 Schnitttage', en: '10 edit days' },
		points: [
			{ de: 'z. B. 4 Langform-Folgen + 16–24 Shorts', en: 'e.g. 4 long-form episodes + 16–24 shorts' },
			{ de: 'Priorisierte Durchlaufzeit', en: 'Priority turnaround' },
			{ de: 'Monatlicher Format-Performance-Review', en: 'Monthly format performance review' },
		],
	},
	{
		id: 'edit-social',
		name: { de: 'Schnitt + Social', en: 'Edit + social' },
		price: { de: 'ab 7.800 €', en: 'from €7,800' },
		unit: { de: 'pro Monat', en: 'per month' },
		days: { de: '10 Schnitttage + Social', en: '10 edit days + social' },
		points: [
			{ de: 'Content-Kalender, Planung, Captions', en: 'Content calendar, scheduling, captions' },
			{ de: 'Leichtes Community-Management', en: 'Light community management' },
			{ de: 'Monatlicher Analytics-Report, Preis nach Kanälen', en: 'Monthly analytics report, priced by channel count' },
		],
	},
];

// "Glass" round (Oct 2026): copy cut hard on the owner's request. Old → new list lives in the hand-off report.

export const pains: { pain: L; fix: L; anim: 'loops' | 'repeat' | 'plan' }[] = [
	{
		pain: { de: 'Zehn Korrekturschleifen.', en: 'Ten revision rounds.' },
		fix: { de: 'Feedback landet einmal im System – als klare Änderungsliste.', en: 'Feedback lands once, in the system – as a clear change list.' },
		anim: 'loops',
	},
	{
		pain: { de: 'Dasselbe Feedback. Jede Folge.', en: 'Same feedback. Every episode.' },
		fix: { de: 'Einmal entschieden, im Template festgehalten.', en: 'Decided once, locked into the template.' },
		anim: 'repeat',
	},
	{
		pain: { de: 'Jede Folge ein Überraschungspaket.', en: 'Every episode a surprise.' },
		fix: { de: 'Festes Format, fester Preis, planbare Lieferung.', en: 'Fixed format, fixed price, predictable delivery.' },
		anim: 'plan',
	},
];

export const steps: { n: string; title: L; text: L; price: L }[] = [
	{
		n: '01',
		title: { de: 'Pilot', en: 'Pilot' },
		text: { de: 'Eine Folge plus drei Shorts aus eurem Material.', en: 'One episode plus three shorts from your footage.' },
		price: { de: '1.950 € · ≈ 1 Woche', en: '€1,950 · ≈ 1 week' },
	},
	{
		n: '02',
		title: { de: 'Setup', en: 'Setup' },
		text: { de: 'Templates, Grafik-Kit, Shorts-Pipeline, SOP.', en: 'Templates, graphics kit, shorts pipeline, SOP.' },
		price: { de: '3.500 € · 3–4 Wochen', en: '€3,500 · 3–4 weeks' },
	},
	{
		n: '03',
		title: { de: 'Retainer', en: 'Retainer' },
		text: { de: 'Ich schneide auf dem System. Monatlich planbar.', en: 'I edit on the system. Plannable month to month.' },
		price: { de: 'ab 4.200 € / Monat', en: 'from €4,200 / month' },
	},
];

export const proof: { title: L; tag: L; text: L; named?: boolean }[] = [
	{
		title: { de: 'Carwow DE – Review-Folgen', en: 'Carwow DE – review episodes' },
		tag: { de: 'Format-Schnitt · 2025', en: 'Format edit · 2025' },
		text: { de: 'Drei Auto-Reviews im bestehenden Carwow-Format – nach Vorgabe, in Serie.', en: 'Three car reviews inside the existing Carwow format – to spec, as a series.' },
		named: true,
	},
	{
		title: { de: 'Langform-Dokus mit 1,2 und 1,4 Mio. Aufrufen', en: 'Long-form docs with 1.2M and 1.4M views' },
		tag: { de: 'Doku-Schnitt · YouTube', en: 'Doc edit · YouTube' },
		text: { de: 'Gedreht und geschnitten für Felix von der Laden.', en: 'Shot and edited for Felix von der Laden.' },
		named: true,
	},
	{
		title: { de: 'D2C-Produktmarke – modulare Ad-Library', en: 'D2C product brand – modular ad library' },
		tag: { de: 'Dreh + Schnitt · 2026', en: 'Shoot + edit · 2026' },
		text: { de: 'Ein Dreh als Baukasten: Hook-Bank, Vorher/Nachher, Installations-Clips.', en: 'One shoot as a kit: hook bank, before/after, installation clips.' },
	},
	{
		title: { de: 'Podcast-Produktion – Workflow-Setup', en: 'Podcast production – workflow setup' },
		tag: { de: 'Workflow-Coaching · 2025', en: 'Workflow coaching · 2025' },
		text: { de: 'DaVinci-Template, Multicam, Farbmanagement – aufgesetzt und übergeben.', en: 'DaVinci template, multicam, colour management – set up and handed over.' },
	},
];

export const tools: L = {
	de: 'Premiere · DaVinci Resolve · Remotion · Frame.io · eigene Offload-App',
	en: 'Premiere · DaVinci Resolve · Remotion · Frame.io · my own offload app',
};

export const faq: { q: L; a: L }[] = [
	{
		q: { de: 'Wie viele Formate hast du schon systematisiert?', en: 'How many formats have you systemised so far?' },
		a: {
			de: 'Ehrlich: wenige. Carwow-Reviews im bestehenden Format, ein Podcast-Workflow in DaVinci, ein Produkt-Dreh als Ad-Baukasten. Deshalb der Pilot zum Festpreis: Ihr seht das Ergebnis, bevor ihr euch bindet.',
			en: 'Honestly: a few. Carwow reviews inside the existing format, a DaVinci podcast workflow, a product shoot as an ad kit. That is why there is a fixed-price pilot: you see the result before you commit.',
		},
	},
	{
		q: { de: 'Ersetzt ihr unseren Editor durch KI?', en: 'Are you replacing our editor with AI?' },
		a: {
			de: 'Nein. KI hilft bei Transkript-Selects und Vorschlägen, die Schnittentscheidungen trifft ein Mensch. Keine generierten Moderatoren, kein Auto-Slop.',
			en: 'No. AI helps with transcript selects and suggestions; a human makes the edit decisions. No generated presenters, no auto-generated slop.',
		},
	},
	{
		q: { de: 'Arbeitet ihr mit unserem bestehenden Team?', en: 'Do you work with our existing team?' },
		a: {
			de: 'Ja, das ist der Normalfall. Das System wird so dokumentiert, dass euer Team es ohne mich weiterführen kann.',
			en: 'Yes, that is the default. The system is documented so your team can run it without me.',
		},
	},
	{
		q: { de: 'Wie startet eine Zusammenarbeit?', en: 'How do we start?' },
		a: {
			de: 'Mit einem 15-Minuten-Call und dann meist dem bezahlten Pilot: eine Folge plus drei Shorts zum Festpreis, voll anrechenbar.',
			en: 'A 15-minute call, then usually the paid pilot: one episode plus three shorts at a fixed price, fully credited.',
		},
	},
];
