type L = { de: string; en: string };

// Offer source: Notion "Format Edit Systems – Offer, Packages & Pitch Kit" (Oct 2026).
// Proof source: invoices / delivered files in Drive. Client names only where Micha already
// lists them publicly (Carwow on micharoessler.com); everything else stays anonymised.
// Copy rule (Oct 2026, owner): written for the buyer (marketing, brand, founders) — outcomes in plain
// words, no tool names, no editing jargon. Prices, units and terms are fixed; never invent results.

// All page copy lives here (merged copy review, Oct 2026). Voice: "ich" = Micha, "ihr/euch" = the buyer,
// "wir" only for the two of us together. EN says "show" for the buyer's series and "editing system" throughout.

// Hero: scroll story → H1. Swap lines here; the story, the static hero and the meta all read from this object.
export const hero = {
	question: { de: 'Keine Zeit fürs Editing?', en: 'No time for editing?' },
	hoursCaption: { de: 'Stunden. Jede Woche. Jede Folge.', en: 'Hours. Every week. Every episode.' },
	chip: { de: '+ 6 h', en: '+ 6 h' },
	promise: { de: 'Ich nehme euch das ab.', en: 'I’ll take it off your plate.' },
	// line break used for the write-on on narrow screens
	promiseLines: { de: ['Ich nehme', 'euch das ab.'], en: ['I’ll take it', 'off your plate.'] },
	h1: { de: 'Euer Format. Ohne eure Schnittzeit.', en: 'Your show. Without the editing hours.' },
	sub: {
		de: 'Euer YouTube-Format wird einmal zum Schnitt-System. Dann schneide ich jede Folge – zum Festpreis.',
		en: 'Your YouTube show, set up once as an editing system. Then I edit every episode at a fixed price.',
	},
	cta: { de: 'Erstgespräch anfragen', en: 'Request an intro call' },
	ctaMicro: { de: '15 Minuten, kostenlos.', en: '15 minutes, free.' },
	cta2: { de: 'Preise ansehen', en: 'See pricing' },
	// Proof: one named example, framed as one of many. The link names the channel, the line says what was edited.
	proof: {
		de: { before: 'Unter anderem für ', link: 'Carwow Deutschland', after: ' – Review-Serie, 2025.' },
		en: { before: 'Among others for ', link: 'Carwow Germany', after: ' – review series, 2025.' },
		href: 'https://www.youtube.com/@carwowDeutschland',
	},
	hint: { de: 'Scrollen', en: 'Scroll' },
};

// "So läuft's": one mechanism line (H2) + three outcomes.
export const how = {
	kicker: { de: 'So läuft’s', en: 'How it works' },
	h2: { de: 'Einmal einrichten. Läuft jede Folge.', en: 'Set up once. Every episode follows.' },
	cards: [
		{
			title: { de: 'Mehr Zeit.', en: 'More time.' },
			text: { de: 'Feedback gebt ihr einmal – es gilt für jede weitere Folge.', en: 'Give feedback once – it applies to every episode after.' },
		},
		{
			title: { de: 'Weniger Kosten.', en: 'Lower cost.' },
			text: {
				de: 'Pakete liegen unter dem Tagessatz von 750 € – das System macht die Arbeit schneller.',
				en: 'Packages cost less than the €750 day rate – the system makes the work faster.',
			},
		},
		{
			title: { de: 'Höhere Qualität.', en: 'Higher quality.' },
			text: {
				de: 'Aufbau, Look, Titel, Grafiken – einmal mit euch festgelegt, in jeder Folge gleich.',
				en: 'Structure, look, titles, graphics – agreed with you once, the same in every episode.',
			},
		},
	] as { title: L; text: L }[],
};

// Packages. Prices, units, day counts and terms are fixed by the offer — never change values here.
// tier 'card' = one of the three cards; 'more' = the compact "Weitere Optionen" line. JSON-LD lists all five.
export const packages: {
	id: string;
	tier: 'card' | 'more';
	name: L;
	sub: L;
	price: L;
	unit: L;
	days: L;
	points: L[];
	cta?: L;
	highlight?: boolean;
}[] = [
	{
		id: 'pilot',
		tier: 'card',
		name: { de: 'Bezahlter Pilot', en: 'Paid pilot' },
		sub: { de: 'Erst testen, dann entscheiden.', en: 'Try it before you commit.' },
		price: { de: '1.950 €', en: '€1,950' },
		unit: { de: 'Festpreis', en: 'fixed price' },
		days: { de: '≈ 2,6 Tage', en: '≈ 2.6 days' },
		points: [
			{ de: '1 fertige Folge + 3 Shorts aus eurem Material', en: '1 finished episode + 3 shorts from your footage' },
			{ de: 'Zu 100 % auf den ersten Monat angerechnet', en: '100% credited to your first month' },
			{ de: 'Überzeugt er nicht, endet es dort – ohne Folgekosten', en: 'If it doesn’t convince you, it ends there – no further costs' },
		],
		cta: { de: 'Pilot anfragen', en: 'Request the pilot' },
		highlight: true,
	},
	{
		id: 'retainer-s',
		tier: 'card',
		name: { de: 'Format-Retainer S', en: 'Format retainer S' },
		sub: { de: 'Ich schneide eure Folgen – jeden Monat.', en: 'I edit your episodes, every month.' },
		price: { de: '4.200 €', en: '€4,200' },
		unit: { de: 'pro Monat', en: 'per month' },
		days: { de: '6 Schnitttage', en: '6 edit days' },
		points: [
			{ de: 'z. B. 2 lange Folgen + 8–12 Shorts', en: 'e.g. 2 long episodes + 8–12 shorts' },
			{ de: 'Nach eurem festgelegten Standard', en: 'To your agreed standard' },
			{ de: '3 Monate Mindestlaufzeit', en: '3-month minimum' },
			{ de: 'Einrichtung nicht enthalten – Setup separat (3.500 € einmalig)', en: 'Setup not included – separate (€3,500 one-off)' },
		],
	},
	{
		id: 'retainer-m',
		tier: 'card',
		name: { de: 'Format-Retainer M', en: 'Format retainer M' },
		sub: { de: 'Für Formate mit hohem Takt.', en: 'For shows that publish often.' },
		price: { de: '6.750 €', en: '€6,750' },
		unit: { de: 'pro Monat', en: 'per month' },
		days: { de: '10 Schnitttage', en: '10 edit days' },
		points: [
			{ de: 'z. B. 4 lange Folgen + 16–24 Shorts', en: 'e.g. 4 long episodes + 16–24 shorts' },
			{ de: 'Eure Folgen haben Vorrang', en: 'Your episodes get priority' },
			{ de: 'Monatlicher Rückblick: was wirkt, was wir ändern', en: 'A monthly review: what works, what we change' },
			{ de: 'Einrichtung nicht enthalten – Setup separat (3.500 € einmalig)', en: 'Setup not included – separate (€3,500 one-off)' },
		],
	},
	{
		id: 'setup',
		tier: 'more',
		name: { de: 'Format-System Setup', en: 'Format system setup' },
		sub: { de: 'Euer Team schneidet – nach festem Standard.', en: 'Your team edits – to a fixed standard.' },
		price: { de: '3.500 €', en: '€3,500' },
		unit: { de: 'einmalig', en: 'one-off' },
		days: { de: '≈ 5 Tage', en: '≈ 5 days' },
		points: [
			{ de: 'Analyse: was sich in jeder Folge wiederholt', en: 'Review: what repeats in every episode' },
			{ de: 'Feste Standards für Aufbau, Titel und Look', en: 'Fixed standards for structure, titles and look' },
			{ de: 'Grafiken, die ihr per Tabelle befüllt', en: 'Graphics your team fills in from a sheet' },
			{ de: 'Shorts-Ablauf, Anleitung, Übergabe-Gespräch', en: 'Shorts routine, written guide, handover call' },
		],
	},
	{
		id: 'edit-social',
		tier: 'more',
		name: { de: 'Schnitt + Social', en: 'Edit + social' },
		sub: { de: 'Schnitt und Kanäle aus einer Hand. Preis nach Anzahl der Kanäle.', en: 'Editing and your channels, one contact. Priced by number of channels.' },
		price: { de: 'ab 7.800 €', en: 'from €7,800' },
		unit: { de: 'pro Monat', en: 'per month' },
		days: { de: '10 Schnitttage + Social', en: '10 edit days + social' },
		points: [
			{ de: 'Redaktionsplan, Post-Planung, Beitragstexte', en: 'Content calendar, scheduling, post copy' },
			{ de: 'Kommentare im Blick (leichtes Community-Management)', en: 'Comment monitoring (light community management)' },
			{ de: 'Monatlicher Zahlen-Report; Preis nach Anzahl der Kanäle', en: 'Monthly report; priced by number of channels' },
		],
	},
];

export const pricing = {
	h2: { de: 'Festpreise. Schriftlich. Vorab.', en: 'Fixed prices. In writing. Upfront.' },
	sub: { de: 'Erst ein Pilot zum Festpreis. Danach ein fester Monatspreis.', en: 'First a fixed-price pilot. Then a fixed monthly price.' },
	tag: { de: 'Hier starten', en: 'Start here' },
	enquire: { de: 'Anfragen', en: 'Enquire' },
	more: { de: 'Weitere Optionen', en: 'More options' },
	discuss: { de: 'Darüber sprechen', en: 'Discuss it' },
	note: {
		de: 'Alle Preise netto. Abrechnung über Micha Roessler LLC (USA); EU-B2B-Kunden: Reverse-Charge, keine deutsche USt. auf der Rechnung. USD-Preise auf Anfrage.',
		en: 'All prices net. Invoiced by Micha Roessler LLC (USA); EU B2B clients: reverse charge. USD pricing on request.',
	},
};

export const faq: { q: L; a: L }[] = [
	{
		q: { de: 'Wie viel Arbeit bleibt bei uns?', en: 'How much work stays with us?' },
		a: {
			de: 'Ihr liefert Material und gebt Feedback – gebündelt, als eine Änderungsliste. Wie viel Zeit das spart, misst der Pilot.',
			en: 'You send footage and give feedback – as one list of changes. The pilot measures how much time that saves.',
		},
	},
	{
		q: { de: 'Ersetzt du unser Team?', en: 'Do you replace our team?' },
		a: {
			de: 'Nein. Ich arbeite mit eurem Team und dokumentiere alles, damit ihr ohne mich weitermachen könnt. KI macht Vorschläge, ein Mensch entscheidet.',
			en: 'No. I work with your team and document everything, so you can carry on without me. AI suggests; a human decides.',
		},
	},
];

// Intro-call booking. While bookingUrl is empty, the page shows its own request widget (day + 15-min slot →
// prefilled email + .ics). Set it to a real scheduling page later and every intro-call CTA links there instead.
export const booking = {
	bookingUrl: '',
	timeZone: 'Europe/Berlin',
	days: 10, // next working days, Mon–Fri
	from: '10:00',
	to: '17:00', // last slot starts 15 minutes before
	slotMinutes: 15,
	email: 'hello@micharoessler.com',
	legend: { de: 'Wunschtermin – 15 Minuten', en: 'Pick a time – 15 minutes' },
	day: { de: 'Tag', en: 'Day' },
	time: { de: 'Uhrzeit (Berlin)', en: 'Time (Berlin)' },
	local: { de: 'bei euch', en: 'your time' },
	none: { de: 'Noch kein Termin gewählt.', en: 'No time picked yet.' },
	chosen: { de: 'Gewählt', en: 'Picked' },
	confirm: { de: 'Das ist eine Anfrage. Ich bestätige per E-Mail – meist innerhalb von zwei Werktagen.', en: 'This is a request. I confirm by email – usually within two working days.' },
	needSlot: { de: 'Bitte wählt zuerst Tag und Uhrzeit.', en: 'Please pick a day and a time first.' },
	submit: { de: 'Termin anfragen', en: 'Request this time' },
	sent: { de: 'Euer Mailprogramm ist offen. Termin vorgemerkt – bis zu meiner Bestätigung.', en: 'Your email app is open. Time noted – until I confirm.' },
	ics: { de: 'Im Kalender vormerken (.ics)', en: 'Add to calendar (.ics)' },
	icsTitle: { de: 'Vorgemerkt: Erstgespräch Formatschnitt (Anfrage)', en: 'Tentative: Formatschnitt intro call (request)' },
	icsNote: { de: 'Angefragt – Micha bestätigt per E-Mail.', en: 'Requested – Micha confirms by email.' },
	open: { de: 'Termin auswählen', en: 'Pick a time' },
};

export const contact = {
	h2: { de: 'Erzählt mir von eurem Format.', en: 'Tell me about your show.' },
	who: { de: 'Micha Rössler – Editor & Filmemacher. Ihr schreibt direkt mit mir.', en: 'Micha Rössler – editor & filmmaker. You write to me directly.' },
	steps: { de: 'Erst ein 15-Minuten-Call, dann meist der Pilot.', en: 'A 15-minute call first, then usually the pilot.' },
	risk: { de: 'Überzeugt der Pilot nicht, endet es dort – ohne Folgekosten.', en: 'If the pilot doesn’t convince you, it ends there – no further costs.' },
	remote: { de: 'Remote, auf Deutsch oder Englisch.', en: 'Remote, in German or English.' },
	mail: { de: 'Antwort in zwei Werktagen. Oder direkt:', en: 'Reply within two working days. Or email:' },
	subject: { de: 'Anfrage Formatschnitt', en: 'Formatschnitt enquiry' },
	name: { de: 'Name', en: 'Name' },
	company: { de: 'Firma', en: 'Company' },
	eps: { de: 'Folgen pro Monat', en: 'Episodes per month' },
	epsOptions: { de: ['1–2', '3–4', '5+', 'Noch offen'], en: ['1–2', '3–4', '5+', 'Not sure yet'] },
	link: { de: 'Link zum Format', en: 'Link to your show' },
	msg: { de: 'Nachricht', en: 'Message' },
	optional: { de: 'optional', en: 'optional' },
	required: { de: 'Pflichtfeld', en: 'required' },
	note: { de: 'Öffnet euer Mailprogramm. Hier wird nichts gespeichert.', en: 'Opens your email app. Nothing is stored here.' },
};

export const meta = {
	title: {
		de: 'Formatschnitt – Freelance-Cutter für YouTube-Formate von Unternehmen',
		en: 'Formatschnitt – Freelance Video Editor for Company YouTube Shows',
	},
	description: {
		de: 'Keine Zeit fürs Editing? Ich richte euer YouTube-Format einmal als Schnitt-System ein und schneide jede Folge. Festpreise ab 1.950 €.',
		en: 'No time for editing? I turn your company’s YouTube show into an editing system, then edit every episode. Fixed prices from €1,950.',
	},
};
