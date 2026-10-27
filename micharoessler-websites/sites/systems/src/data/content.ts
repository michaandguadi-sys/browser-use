type L = { de: string; en: string };

// Offer source: Notion "Format Edit Systems – Offer, Packages & Pitch Kit" (Oct 2026).
// Proof source: invoices / delivered files in Drive. Client names only where Micha already
// lists them publicly (Carwow on micharoessler.com); everything else stays anonymised.
// Copy rule (Oct 2026, owner): written for the buyer (marketing, brand, founders) — outcomes in plain
// words, no tool names, no editing jargon. Prices, units and terms are fixed; never invent results.

export const packages: {
	id: string;
	name: L;
	sub: L;
	for: L;
	price: L;
	unit: L;
	days: L;
	points: L[];
	result: L;
	highlight?: boolean;
}[] = [
	{
		id: 'pilot',
		name: { de: 'Bezahlter Pilot', en: 'Paid pilot' },
		sub: { de: 'Eine Testfolge zum Festpreis', en: 'One test episode at a fixed price' },
		for: { de: 'Ihr wollt sehen, wie es läuft, bevor ihr euch bindet.', en: 'You want to see how it works before you commit.' },
		price: { de: '1.950 €', en: '€1,950' },
		unit: { de: 'Festpreis', en: 'fixed' },
		days: { de: '≈ 2,6 Tage', en: '≈ 2.6 days' },
		points: [
			{ de: '1 fertige Folge + 3 Shorts aus eurem Material', en: '1 finished episode + 3 shorts from your footage' },
			{ de: 'Ihr seht Qualität und Tempo am echten Beispiel', en: 'You see quality and turnaround on a real example' },
		],
		result: { de: 'Eine sichere Entscheidung – und der Preis wird zu 100 % auf den ersten Monat angerechnet.', en: 'A safe decision – and the price is 100% credited to your first month.' },
		highlight: true,
	},
	{
		id: 'setup',
		name: { de: 'Format-System Setup', en: 'Format system setup' },
		sub: { de: 'Euer Format einmal sauber festgelegt', en: 'Your format, defined properly once' },
		for: { de: 'Euer eigenes Team schneidet – aber jede Folge wird neu erfunden.', en: 'Your own team edits – but every episode gets reinvented.' },
		price: { de: '3.500 €', en: '€3,500' },
		unit: { de: 'einmalig', en: 'one-off' },
		days: { de: '≈ 5 Tage', en: '≈ 5 days' },
		points: [
			{ de: 'Analyse eurer Show: was sich in jeder Folge wiederholt', en: 'A review of your show: what repeats in every episode' },
			{ de: 'Feste Standards für Aufbau, Titel und Look', en: 'Fixed standards for structure, titles and look' },
			{ de: 'Grafiken, die ihr selbst per Tabelle befüllt', en: 'Graphics your team fills in from a simple sheet' },
			{ de: 'Ablauf für Shorts aus jeder Folge, schriftliche Anleitung und Übergabe-Gespräch', en: 'A routine for shorts from every episode, a written guide and a handover call' },
		],
		result: { de: 'Euer Team startet jede Folge vom selben Standard – statt bei null.', en: 'Your team starts every episode from the same standard – not from scratch.' },
	},
	{
		id: 'retainer-s',
		name: { de: 'Format-Retainer S', en: 'Format retainer S' },
		sub: { de: 'Ich schneide eure Folgen – jeden Monat', en: 'I edit your episodes – every month' },
		for: { de: 'Ihr veröffentlicht regelmäßig und wollt den Schnitt abgeben.', en: 'You publish regularly and want to hand off the editing.' },
		price: { de: '4.200 €', en: '€4,200' },
		unit: { de: 'pro Monat', en: 'per month' },
		days: { de: '6 Schnitttage', en: '6 edit days' },
		points: [
			{ de: 'z. B. 2 lange Folgen + 8–12 Shorts', en: 'e.g. 2 long episodes + 8–12 shorts' },
			{ de: 'Geschnitten nach eurem festgelegten Standard', en: 'Edited to your agreed standard' },
			{ de: '3 Monate Mindestlaufzeit', en: '3-month minimum' },
		],
		result: { de: 'Fester Monatspreis, gleichbleibende Qualität – euer Team hat den Kopf frei.', en: 'A fixed monthly price, consistent quality – your team is free for other work.' },
	},
	{
		id: 'retainer-m',
		name: { de: 'Format-Retainer M', en: 'Format retainer M' },
		sub: { de: 'Für Formate mit hohem Takt', en: 'For high-frequency formats' },
		for: { de: 'Ihr veröffentlicht oft und braucht verlässliches Tempo.', en: 'You publish often and need reliable pace.' },
		price: { de: '6.750 €', en: '€6,750' },
		unit: { de: 'pro Monat', en: 'per month' },
		days: { de: '10 Schnitttage', en: '10 edit days' },
		points: [
			{ de: 'z. B. 4 lange Folgen + 16–24 Shorts', en: 'e.g. 4 long episodes + 16–24 shorts' },
			{ de: 'Eure Folgen haben Vorrang', en: 'Your episodes get priority' },
			{ de: 'Monatlicher Rückblick: was wirkt, was wir ändern', en: 'A monthly review: what works, what we change' },
		],
		result: { de: 'Ein volles Programm zum festen Monatspreis.', en: 'A full publishing schedule at a fixed monthly price.' },
	},
	{
		id: 'edit-social',
		name: { de: 'Schnitt + Social', en: 'Edit + social' },
		sub: { de: 'Schnitt plus Betreuung eurer Kanäle', en: 'Editing plus channel management' },
		for: { de: 'Ihr wollt Schnitt und Veröffentlichung aus einer Hand.', en: 'You want editing and publishing from one source.' },
		price: { de: 'ab 7.800 €', en: 'from €7,800' },
		unit: { de: 'pro Monat', en: 'per month' },
		days: { de: '10 Schnitttage + Social', en: '10 edit days + social' },
		points: [
			{ de: 'Redaktionsplan, Planung der Posts, Beitragstexte', en: 'Content calendar, post scheduling, post copy' },
			{ de: 'Kommentare im Blick (leichtes Community-Management)', en: 'An eye on comments (light community management)' },
			{ de: 'Monatlicher Zahlen-Report; Preis nach Anzahl der Kanäle', en: 'Monthly numbers report; priced by number of channels' },
		],
		result: { de: 'Ein Ansprechpartner vom Rohmaterial bis zum veröffentlichten Post.', en: 'One contact from raw footage to published post.' },
	},
];

export const audience: L[] = [
	{ de: 'Ihr habt ein wiederkehrendes Videoformat – und jede Folge fühlt sich an wie die erste.', en: 'You run a recurring video format – and every episode feels like the first.' },
	{ de: 'Euer Team verbringt zu viel Zeit mit Feedback-Runden.', en: 'Your team spends too much time in feedback rounds.' },
	{ de: 'Ihr wollt mehr aus jedem Dreh holen: Folge, Shorts, Anzeigen.', en: 'You want more from every shoot: episode, shorts, ads.' },
];

export const pains: { pain: L; fix: L; anim: 'loops' | 'repeat' | 'plan' }[] = [
	{
		pain: { de: 'Zehn Korrekturschleifen.', en: 'Ten revision rounds.' },
		fix: { de: 'Feedback gebt ihr einmal, gebündelt an einer Stelle.', en: 'You give feedback once, in one place.' },
		anim: 'loops',
	},
	{
		pain: { de: 'Dasselbe Feedback. Jede Folge.', en: 'Same feedback. Every episode.' },
		fix: { de: 'Einmal entschieden – und in jeder Folge umgesetzt.', en: 'Decided once – and applied in every episode.' },
		anim: 'repeat',
	},
	{
		pain: { de: 'Jede Folge ein Überraschungspaket.', en: 'Every episode a surprise.' },
		fix: { de: 'Fester Standard, fester Preis, planbare Lieferung.', en: 'A fixed standard, a fixed price, predictable delivery.' },
		anim: 'plan',
	},
];

export const steps: { n: string; title: L; text: L; price: L }[] = [
	{
		n: '01',
		title: { de: 'Pilot', en: 'Pilot' },
		text: { de: 'Eine Testfolge plus drei Shorts aus eurem Material.', en: 'One test episode plus three shorts from your footage.' },
		price: { de: '1.950 € · ≈ 1 Woche', en: '€1,950 · ≈ 1 week' },
	},
	{
		n: '02',
		title: { de: 'Setup', en: 'Setup' },
		text: { de: 'Ich lege euer Format einmal fest – mit Anleitung für euer Team.', en: 'I define your format once – with a guide for your team.' },
		price: { de: '3.500 € · 3–4 Wochen', en: '€3,500 · 3–4 weeks' },
	},
	{
		n: '03',
		title: { de: 'Retainer', en: 'Retainer' },
		text: { de: 'Ich schneide jeden Monat nach diesem Standard. Fester Preis.', en: 'I edit to that standard every month. Fixed price.' },
		price: { de: 'ab 4.200 € / Monat', en: 'from €4,200 / month' },
	},
];

export const proof: { title: L; tag: L; text: L; named?: boolean }[] = [
	{
		title: { de: 'Carwow DE – Review-Serie', en: 'Carwow DE – review series' },
		tag: { de: 'Serie · 2025', en: 'Series · 2025' },
		text: { de: 'Drei Folgen einer laufenden Auto-Review-Serie – im bestehenden Format, exakt nach Vorgabe.', en: 'Three episodes of a running car-review series – in the existing format, exactly to spec.' },
		named: true,
	},
	{
		title: { de: 'Langform-Dokus mit 1,2 und 1,4 Mio. Aufrufen', en: 'Long-form docs with 1.2M and 1.4M views' },
		tag: { de: 'Doku · YouTube', en: 'Documentary · YouTube' },
		text: { de: 'Zwei lange YouTube-Dokus für Felix von der Laden – gedreht und geschnitten.', en: 'Two long YouTube documentaries for Felix von der Laden – shot and edited.' },
		named: true,
	},
	{
		title: { de: 'D2C-Produktmarke – Anzeigen-Bibliothek aus einem Dreh', en: 'D2C product brand – an ad library from one shoot' },
		tag: { de: 'Dreh + Schnitt · 2026', en: 'Shoot + edit · 2026' },
		text: { de: 'Ein Dreh, geplant als Baukasten. Ziel des Kunden: Material für viele Anzeigen, Anleitungen und ein Gründer-Interview.', en: 'One shoot, planned as a kit. The client’s goal: material for many ads, how-to videos and a founder interview.' },
	},
	{
		title: { de: 'Wöchentlicher Podcast – fester Produktionsablauf', en: 'Weekly podcast – a fixed production routine' },
		tag: { de: 'Beratung · 2025', en: 'Consulting · 2025' },
		text: { de: 'Ein klarer Ablauf vom Material bis zur fertigen Folge – aufgesetzt und an das Team übergeben.', en: 'A clear routine from footage to finished episode – set up and handed over to the team.' },
	},
];

export const faq: { q: L; a: L }[] = [
	{
		q: { de: 'Was kostet das und wie wird abgerechnet?', en: 'What does it cost and how is it invoiced?' },
		a: {
			de: 'Festpreise, schriftlich vor Start: Pilot 1.950 €, Setup 3.500 € einmalig, laufender Schnitt ab 4.200 € pro Monat (3 Monate Mindestlaufzeit). Basis ist ein Tagessatz von 750 €. Alle Preise netto, Abrechnung über Micha Roessler LLC (USA); für B2B-Kunden in der EU gilt Reverse-Charge.',
			en: 'Fixed prices, in writing before we start: pilot €1,950, setup €3,500 one-off, ongoing editing from €4,200 per month (3-month minimum). The base is a day rate of €750. All prices net, invoiced by Micha Roessler LLC (USA); EU B2B clients are invoiced under reverse charge.',
		},
	},
	{
		q: { de: 'Wie viel Aufwand bleibt bei unserem Team?', en: 'How much work stays with our team?' },
		a: {
			de: 'Ihr liefert das Material und gebt Feedback – gebündelt an einer Stelle, als klare Änderungsliste. Was einmal entschieden ist, gilt für die nächsten Folgen. Wie viel Zeit das bei euch spart, messen wir im Pilot.',
			en: 'You supply the footage and give feedback – in one place, as a clear list of changes. What is decided once applies to the next episodes. How much time that saves you is what the pilot measures.',
		},
	},
	{
		q: { de: 'Ersetzt ihr unser bestehendes Team?', en: 'Do you replace our existing team?' },
		a: {
			de: 'Nein. Die Zusammenarbeit mit eurem Team ist der Normalfall, und alles wird so dokumentiert, dass euer Team es auch ohne mich weiterführen kann. KI hilft bei Vorschlägen – die Entscheidungen trifft ein Mensch.',
			en: 'No. Working with your team is the default, and everything is documented so your team can run it without me. AI helps with suggestions – a human makes the decisions.',
		},
	},
	{
		q: { de: 'Wie starten wir?', en: 'How do we start?' },
		a: {
			de: 'Mit einem 15-Minuten-Call und dann meist dem bezahlten Pilot: eine Folge plus drei Shorts zum Festpreis, voll anrechenbar.',
			en: 'A 15-minute call, then usually the paid pilot: one episode plus three shorts at a fixed price, fully credited.',
		},
	},
];
