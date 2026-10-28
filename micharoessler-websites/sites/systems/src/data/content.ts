type L = { de: string; en: string };

// Offer source: owner, Oct 2026 — "Setup + Folgen-Abo" (replaces the day-rate packages). All prices live in
// `offer` below: change a number there and the cards, calculator, quiz and structured data follow.
// Proof source: invoices / delivered files in Drive. Client names only where Micha already
// lists them publicly (Carwow on micharoessler.com); everything else stays anonymised.
// Copy rule (Oct 2026, owner): written for the buyer (marketing, brand, founders) — outcomes in plain
// words, no tool names, no editing jargon. Prices, units and terms are fixed; never invent results.

// All page copy lives here (merged copy review, Oct 2026). Voice: "ich" = Micha, "ihr/euch" = the buyer,
// "wir" only for the two of us together. EN says "show" for the buyer's series and "editing system" throughout.

// Cinematic layer switches (generated footage in public/media/bg). Turn the tunnel off on phones if a real-device
// test shows jank there; everything else keeps working.
export const cinema = { tunnelOnPhones: true, ambientOnDesktop: true };

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
		de: 'Ihr liefert das Material. Ich liefere jeden Monat fertige Folgen und Shorts – im gleichen Standard, zum Festpreis.',
		en: 'You send the footage. I deliver finished episodes and shorts every month – same standard, fixed price.',
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

// The benefit, at a glance: before / with Formatschnitt. Plain facts from the offer, no figures.
export const compare = {
	h2: { de: 'Was sich für euch ändert', en: 'What changes for you' },
	sub: {
		de: 'Die Routine-Folgen laufen über mein System – euer Team hat wieder Zeit für Kreatives.',
		en: 'The routine episodes run through my system – your team gets its time back for creative work.',
	},
	before: { de: 'Vorher', en: 'Before' },
	after: { de: 'Mit Formatschnitt', en: 'With Formatschnitt' },
	rows: [
		{
			k: { de: 'Schnitt', en: 'Editing' },
			before: { de: 'Euer Team schneidet nebenher', en: 'Your team edits on the side' },
			after: { de: 'Ich schneide – ihr gebt frei', en: 'I edit – you approve' },
		},
		{
			k: { de: 'Euer Team', en: 'Your team' },
			before: { de: 'Steckt im Routine-Schnitt', en: 'Stuck in routine editing' },
			after: { de: 'Zeit für kreative Aufgaben', en: 'Time for creative work' },
		},
		{
			k: { de: 'Feedback', en: 'Feedback' },
			before: { de: 'Jede Folge dieselben Korrekturen', en: 'The same fixes, every episode' },
			after: { de: 'Einmal entschieden, gilt für jede Folge', en: 'Decided once, applies to every episode' },
		},
		{
			k: { de: 'Kosten', en: 'Cost' },
			before: { de: 'Fixe Personalkosten', en: 'Fixed staff costs' },
			after: { de: 'Fester Preis pro Folge', en: 'A fixed price per episode' },
		},
		{
			k: { de: 'Ergebnis', en: 'Result' },
			before: { de: 'Jede Folge sieht anders aus', en: 'Every episode looks different' },
			after: { de: 'Jede Folge im gleichen Standard', en: 'Every episode to the same standard' },
		},
	] as { k: L; before: L; after: L }[],
};

// "So läuft's": the how — three steps, one line each (the benefit lives in `compare`).
export const how = {
	kicker: { de: 'So läuft’s', en: 'How it works' },
	h2: { de: 'Einmal einrichten. Läuft jede Folge.', en: 'Set up once. Every episode follows.' },
	steps: [
		{
			title: { de: 'Einrichten', en: 'Set up' },
			text: { de: 'Wir legen einmal fest, wie eure Folgen aussehen: Aufbau, Look, Titel, Grafiken.', en: 'Together we define once how your episodes look: structure, look, titles, graphics.' },
		},
		{
			title: { de: 'Ich schneide jeden Monat', en: 'I edit every month' },
			text: { de: 'Ihr schickt das Material, ich liefere fertige Folgen und Shorts nach diesem Standard.', en: 'You send the footage; I deliver finished episodes and shorts to that standard.' },
		},
		{
			title: { de: 'Ihr gebt frei', en: 'You approve' },
			text: { de: 'Feedback kommt gebündelt als eine Liste – was einmal entschieden ist, gilt weiter.', en: 'Feedback comes as one list – what’s decided once stays decided.' },
		},
	] as { title: L; text: L }[],
};

// The offer in numbers (EUR, net) — the single place to change prices. Abo prices are per month.
export const offer = {
	pilot: 950,
	setup: 1900,
	aboS: { price: 2200, episodes: 4 },
	aboM: { price: 3900, episodes: 8 },
	shortsPerEpisode: 3,
};
const de0 = (n: number) => `${n.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €`;
const en0 = (n: number) => `€${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
const eur = (n: number): L => ({ de: de0(n), en: en0(n) });
const perEpS = Math.round(offer.aboS.price / offer.aboS.episodes); // 550
const perEpM = Math.round(offer.aboM.price / offer.aboM.episodes / 10) * 10; // ≈ 490 (3.900 / 8 = 487,50)
export const perEpisode = { s: perEpS, m: perEpM, mExact: offer.aboM.price / offer.aboM.episodes };
const setupLine: L = { de: `Setup separat (${de0(offer.setup)} einmalig)`, en: `Setup is separate (${en0(offer.setup)} one-off)` };

// Cards: Pilot (highlight), Setup, Abo S, Abo M. "Mehr Folgen / Social" is a line under the cards.
export const packages: {
	id: string;
	name: L;
	sub: L;
	price: L;
	amount: number;
	monthly?: boolean;
	unit: L;
	note?: L;
	points: L[];
	cta?: L;
	highlight?: boolean;
}[] = [
	{
		id: 'pilot',
		name: { de: 'Bezahlter Pilot', en: 'Paid pilot' },
		sub: { de: 'Erst testen, dann entscheiden.', en: 'Try it before you commit.' },
		price: eur(offer.pilot),
		amount: offer.pilot,
		unit: { de: 'Festpreis', en: 'fixed price' },
		points: [
			{ de: '1 fertige Folge + 3 Shorts aus eurem Material', en: '1 finished episode + 3 shorts from your footage' },
			{ de: 'Voll auf das Setup angerechnet', en: 'Fully credited to the setup' },
			{ de: 'Überzeugt er nicht, endet es dort – ohne Folgekosten', en: 'If it doesn’t convince you, it ends there – no further costs' },
		],
		cta: { de: 'Pilot anfragen', en: 'Request the pilot' },
		highlight: true,
	},
	{
		id: 'setup',
		name: { de: 'Setup', en: 'Setup' },
		sub: { de: 'Euer Format wird einmal als System eingerichtet.', en: 'Your show is set up once as a system.' },
		price: eur(offer.setup),
		amount: offer.setup,
		unit: { de: 'einmalig', en: 'one-off' },
		points: [
			{ de: 'Aufbau, Look, Titel, Grafiken', en: 'Structure, look, titles, graphics' },
			{ de: 'Ablauf für die Shorts aus jeder Folge', en: 'A routine for the shorts from every episode' },
			{ de: 'Der Pilot wird voll angerechnet', en: 'The pilot is fully credited' },
		],
	},
	{
		id: 'abo-s',
		name: { de: 'Folgen-Abo S', en: 'Episode plan S' },
		sub: { de: 'Ich schneide eure Folgen – jeden Monat.', en: 'I edit your episodes, every month.' },
		price: eur(offer.aboS.price),
		amount: offer.aboS.price,
		monthly: true,
		unit: { de: 'pro Monat', en: 'per month' },
		note: { de: `≈ ${de0(perEpS)} pro Folge`, en: `≈ ${en0(perEpS)} per episode` },
		points: [
			{ de: `${offer.aboS.episodes} Folgen pro Monat, je mit ${offer.shortsPerEpisode} Shorts`, en: `${offer.aboS.episodes} episodes a month, each with ${offer.shortsPerEpisode} shorts` },
			{ de: 'Nach eurem festgelegten Standard', en: 'To your agreed standard' },
			{ de: '3 Monate Mindestlaufzeit', en: '3-month minimum' },
			setupLine,
		],
	},
	{
		id: 'abo-m',
		name: { de: 'Folgen-Abo M', en: 'Episode plan M' },
		sub: { de: 'Für Formate mit hohem Takt.', en: 'For shows that publish often.' },
		price: eur(offer.aboM.price),
		amount: offer.aboM.price,
		monthly: true,
		unit: { de: 'pro Monat', en: 'per month' },
		note: { de: `≈ ${de0(perEpM)} pro Folge`, en: `≈ ${en0(perEpM)} per episode` },
		points: [
			{ de: `${offer.aboM.episodes} Folgen pro Monat, je mit ${offer.shortsPerEpisode} Shorts`, en: `${offer.aboM.episodes} episodes a month, each with ${offer.shortsPerEpisode} shorts` },
			{ de: 'Nach eurem festgelegten Standard', en: 'To your agreed standard' },
			setupLine,
		],
	},
];

export const pricing = {
	h2: { de: 'Festpreise. Schriftlich. Vorab.', en: 'Fixed prices. In writing. Upfront.' },
	sub: {
		de: `Pilot, einmal Setup, dann ein fester Monatspreis – ab ca. ${de0(perEpM)} pro Folge.`,
		en: `Pilot, a one-off setup, then a fixed monthly price – from about ${en0(perEpM)} per episode.`,
	},
	tag: { de: 'Hier starten', en: 'Start here' },
	enquire: { de: 'Anfragen', en: 'Enquire' },
	more: { de: 'Mehr Folgen oder Social-Betreuung:', en: 'More episodes or social media support:' },
	moreValue: { de: 'auf Anfrage', en: 'on request' },
	moreName: { de: 'Mehr Folgen / Social', en: 'More episodes / social' },
	discuss: { de: 'Darüber sprechen', en: 'Discuss it' },
	note: {
		de: 'Alle Preise netto. Abrechnung über Micha Roessler LLC (USA); EU-B2B-Kunden: Reverse-Charge, keine deutsche USt. auf der Rechnung. USD-Preise auf Anfrage.',
		en: 'All prices net. Invoiced by Micha Roessler LLC (USA); EU B2B clients: reverse charge. USD pricing on request.',
	},
};

// Calculator: staff editor vs. Formatschnitt. Defaults are deliberately conservative (salary a little under the
// published medians, on-costs at the low end). Figures checked Oct 2026: gehalt.de median 3.795 € (Q1 3.383 €,
// Q3 4.256 €), brutto-netto-gehaltsrechner.de median 3.800 €; employer on-costs 20–23 % (lohnklar.de), 21–25 % (factorialhr.de).
export const calc = {
	h2: { de: 'Günstiger als ein Angestellter.', en: 'Cheaper than an employee.' },
	sub: { de: 'Angestellter Cutter oder Formatschnitt – mit euren Zahlen gerechnet.', en: 'A staff editor or Formatschnitt – worked out with your numbers.' },
	defaults: { eps: 4, salary: 3700, onCost: 21, workplace: 0, hours: 16 },
	eps: { de: 'Folgen pro Monat', en: 'Episodes per month' },
	salary: { de: 'Bruttogehalt Cutter / Monat', en: 'Editor’s gross salary / month' },
	salaryHint: {
		de: 'Zum Vergleich: Median laut gehalt.de 3.795 €, laut brutto-netto-gehaltsrechner.de 3.800 €.',
		en: 'For reference: German median €3,795 (gehalt.de), €3,800 (brutto-netto-gehaltsrechner.de).',
	},
	onCost: { de: 'Lohnnebenkosten (Arbeitgeber)', en: 'Employer on-costs' },
	onCostHint: { de: 'üblich ca. 20–25 %', en: 'typically about 20–25%' },
	workplace: { de: 'Arbeitsplatz & Software / Monat', en: 'Workstation & software / month' },
	workplaceHint: { de: 'eigene Annahme', en: 'your own assumption' },
	hours: { de: 'Stunden pro Folge heute im Team', en: 'Hours per episode in your team today' },
	employee: { de: 'Angestellter Cutter', en: 'Staff editor' },
	employeeNote: { de: 'Fixkosten, auch in ruhigen Monaten', en: 'Fixed cost, even in quiet months' },
	us: { de: 'Formatschnitt', en: 'Formatschnitt' },
	perMonth: { de: '/ Monat', en: '/ month' },
	perEpisode: { de: 'pro Folge', en: 'per episode' },
	setupNote: { de: `+ ${de0(offer.setup)} Setup einmalig`, en: `+ ${en0(offer.setup)} one-off setup` },
	onRequest: { de: 'mehr als 8 Folgen: auf Anfrage', en: 'more than 8 episodes: on request' },
	saving: { de: 'Ersparnis', en: 'Saving' },
	perYear: { de: 'pro Jahr', en: 'a year' },
	firstYear: { de: 'im ersten Jahr inkl. Setup', en: 'in year one, incl. setup' },
	notCheaper: {
		de: 'Bei diesen Werten ist Formatschnitt nicht günstiger als ein Angestellter.',
		en: 'With these numbers, Formatschnitt is not cheaper than an employee.',
	},
	freed: { de: 'Stunden pro Monat frei für kreative Aufgaben in eurem Team', en: 'hours a month freed up for creative work in your team' },
	plan: { de: 'Passend', en: 'Fits' },
	planS: { de: 'Folgen-Abo S', en: 'Episode plan S' },
	planM: { de: 'Folgen-Abo M', en: 'Episode plan M' },
	planX: { de: 'Individuelles Angebot', en: 'Custom quote' },
	planFew: { de: `weniger als ${offer.aboS.episodes} Folgen: Preis pro Folge auf Anfrage`, en: `fewer than ${offer.aboS.episodes} episodes: per-episode price on request` },
	maths: { de: 'Rechenweg zeigen', en: 'Show the maths' },
	cta: { de: 'Damit anfragen', en: 'Enquire about this' },
	note: {
		de: 'Schätzung, kein Angebot. Ein Angestellter übernimmt oft auch andere Aufgaben.',
		en: 'An estimate, not a quote. An employee often covers other tasks, too.',
	},
	sources: {
		de: 'Quellen: gehalt.de und brutto-netto-gehaltsrechner.de (Gehalt), lohnklar.de und factorialhr.de (Lohnnebenkosten), Stand Okt. 2026.',
		en: 'Sources: gehalt.de and brutto-netto-gehaltsrechner.de (salary), lohnklar.de and factorialhr.de (employer on-costs), as of Oct 2026.',
	},
};

// Format check (quiz above the contact section). Client-side only, nothing stored. Scoring is shown on the result.
export const check = {
	h2: { de: 'Passt euer Format?', en: 'Is your show a fit?' },
	sub: { de: '5 Fragen, 30 Sekunden.', en: '5 questions, 30 seconds.' },
	step: { de: 'Frage {n} von {t}', en: 'Question {n} of {t}' },
	next: { de: 'Weiter', en: 'Next' },
	back: { de: 'Zurück', en: 'Back' },
	result: { de: 'Ergebnis anzeigen', en: 'Show result' },
	restart: { de: 'Nochmal', en: 'Start over' },
	noscript: { de: 'Der Format-Check braucht JavaScript – oder fragt einfach direkt an.', en: 'The show check needs JavaScript – or just get in touch directly.' },
	questions: [
		{
			id: 'freq',
			q: { de: 'Wie oft erscheint eine Folge?', en: 'How often does an episode come out?' },
			a: [
				{ de: 'wöchentlich', en: 'weekly', pts: 3 },
				{ de: 'alle 2 Wochen', en: 'every 2 weeks', pts: 2 },
				{ de: 'monatlich', en: 'monthly', pts: 1 },
				{ de: 'unregelmäßig', en: 'irregularly', pts: 0 },
			],
		},
		{
			id: 'structure',
			q: { de: 'Sind eure Folgen ähnlich aufgebaut?', en: 'Are your episodes built the same way?' },
			a: [
				{ de: 'ja, immer gleich', en: 'yes, always the same', pts: 3 },
				{ de: 'meistens', en: 'mostly', pts: 2 },
				{ de: 'jedes Mal anders', en: 'different every time', pts: 0 },
			],
		},
		{
			id: 'recurring',
			q: { de: 'Gibt es wiederkehrende Elemente (Intro, Titel, Grafiken, Einblendungen)?', en: 'Are there recurring elements (intro, titles, graphics, on-screen text)?' },
			a: [
				{ de: 'viele', en: 'many', pts: 3 },
				{ de: 'einige', en: 'some', pts: 2 },
				{ de: 'kaum', en: 'hardly any', pts: 0 },
			],
		},
		{
			id: 'who',
			q: { de: 'Wer schneidet heute?', en: 'Who edits today?' },
			a: [
				{ de: 'unser Team', en: 'our team', pts: 0 },
				{ de: 'Freelancer', en: 'freelancers', pts: 0 },
				{ de: 'Agentur', en: 'an agency', pts: 0 },
				{ de: 'noch niemand', en: 'nobody yet', pts: 0 },
			],
		},
		{
			id: 'shorts',
			q: { de: 'Sollen aus jeder Folge Shorts entstehen?', en: 'Should every episode also become shorts?' },
			a: [
				{ de: 'ja', en: 'yes', pts: 2 },
				{ de: 'manchmal', en: 'sometimes', pts: 1 },
				{ de: 'nein', en: 'no', pts: 0 },
			],
		},
	] as { id: string; q: L; a: (L & { pts: number })[] }[],
	max: 11,
	points: { de: '{s} von {m} Punkten', en: '{s} of {m} points' },
	tiers: [
		{ min: 9, title: { de: 'Sehr gut geeignet', en: 'A very good fit' }, text: { de: 'Euer Format wiederholt sich – genau dafür ist ein Schnitt-System gebaut.', en: 'Your show repeats itself – that is exactly what an editing system is built for.' } },
		{ min: 5, title: { de: 'Gut geeignet – mit Pilot testen', en: 'A good fit – test it with the pilot' }, text: { de: 'Vieles wiederholt sich. Der Pilot zeigt an einer echten Folge, wie gut es passt.', en: 'A lot repeats. The pilot shows on a real episode how well it fits.' } },
		{ min: 0, title: { de: 'Eher nicht', en: 'Probably not' }, text: { de: 'Ein System lohnt sich erst bei wiederkehrenden Folgen. Sprecht mich trotzdem gern an – manchmal passt ein Teil davon.', en: 'A system pays off once episodes recur. Feel free to talk to me anyway – sometimes part of it fits.' } },
	] as { min: number; title: L; text: L }[],
	rec: { de: 'Empfehlung', en: 'Suggestion' },
	recWeekly: {
		de: `Folgen-Abo S (${offer.aboS.episodes} Folgen pro Monat) – bei mehr als ${offer.aboS.episodes} Folgen Folgen-Abo M.`,
		en: `Episode plan S (${offer.aboS.episodes} episodes a month) – for more than ${offer.aboS.episodes}, episode plan M.`,
	},
	recLess: {
		de: `Folgen-Abo S – oder bei wenigen Folgen ein Angebot auf Anfrage.`,
		en: `Episode plan S – or, for only a few episodes, a quote on request.`,
	},
	recIrregular: { de: 'Erst der Pilot, dann entscheiden wir gemeinsam.', en: 'The pilot first, then we decide together.' },
	recTeam: {
		de: `Will euer Team weiter selbst schneiden: nur das Setup (${de0(offer.setup)} einmalig).`,
		en: `If your team wants to keep editing itself: just the setup (${en0(offer.setup)} one-off).`,
	},
	start: { de: `Start: Pilot (${de0(offer.pilot)})`, en: `Start: pilot (${en0(offer.pilot)})` },
	how: { de: 'So wird gezählt', en: 'How it’s scored' },
	howText: {
		de: 'Rhythmus: wöchentlich 3, alle 2 Wochen 2, monatlich 1, unregelmäßig 0 · Aufbau: 3 / 2 / 0 · Wiederkehrende Elemente: 3 / 2 / 0 · Shorts: 2 / 1 / 0. Ab 9 Punkten sehr gut, ab 5 gut geeignet. „Wer schneidet“ ändert nur die Empfehlung.',
		en: 'Rhythm: weekly 3, every 2 weeks 2, monthly 1, irregular 0 · Structure: 3 / 2 / 0 · Recurring elements: 3 / 2 / 0 · Shorts: 2 / 1 / 0. 9+ points: very good, 5+: good fit. “Who edits” only changes the suggestion.',
	},
	cta: { de: 'Mit diesem Ergebnis anfragen', en: 'Enquire with this result' },
	prefix: { de: 'Format-Check', en: 'Show check' },
	stored: { de: 'Nichts wird gespeichert – alles bleibt in eurem Browser.', en: 'Nothing is stored – it all stays in your browser.' },
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
			de: 'Nein – ich übernehme die Routine-Folgen, euer Team bekommt Zeit für kreative Aufgaben. Alles ist dokumentiert.',
			en: 'No – I take on the routine episodes, so your team gets time for creative work. Everything is documented.',
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
		de: `Keine Zeit fürs Editing? Ich richte euer YouTube-Format einmal als Schnitt-System ein und schneide jede Folge. Festpreise ab ca. ${de0(perEpM)} pro Folge.`,
		en: `No time for editing? I turn your company’s YouTube show into an editing system, then edit every episode. Fixed prices from about ${en0(perEpM)} per episode.`,
	},
};
