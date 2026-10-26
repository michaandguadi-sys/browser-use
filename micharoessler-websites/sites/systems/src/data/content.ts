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

export const systemParts: { n: string; title: L; text: L }[] = [
	{
		n: '01',
		title: { de: 'Format-Audit', en: 'Format audit' },
		text: {
			de: 'Ich zerlege eure Show in ihre wiederkehrenden Beats: Cold Open, Spec-Cards, Test-Segmente, Verdict, Endscreen. Danach ist klar, was jedes Mal neu gebaut wird – und was nicht mehr muss.',
			en: 'I break your show into its repeatable beats: cold open, spec cards, test segments, verdict, end screen. Then it is obvious what gets rebuilt every episode, and what never has to be again.',
		},
	},
	{
		n: '02',
		title: { de: 'Projekt-Templates', en: 'Project templates' },
		text: {
			de: 'Bins, Sequenzen, Benennung, Audio-Kette und Export-Presets in Premiere oder DaVinci Resolve. Jede Folge startet im selben, sauberen Projekt.',
			en: 'Bins, sequences, naming, audio chain and export presets in Premiere or DaVinci Resolve. Every episode starts in the same clean project.',
		},
	},
	{
		n: '03',
		title: { de: 'Datengetriebene Grafiken', en: 'Data-driven graphics' },
		text: {
			de: 'Spec-Cards, Vergleichstabellen, Score-Overlays und Bauchbinden als MoGRTs oder programmatische Remotion-Templates – befüllt aus einer Tabelle statt jedes Mal neu animiert.',
			en: 'Spec cards, comparison tables, score overlays and lower thirds as MoGRTs or programmatic Remotion templates, filled from a spreadsheet instead of re-animated every time.',
		},
	},
	{
		n: '04',
		title: { de: 'Shorts-Pipeline', en: 'Shorts pipeline' },
		text: {
			de: 'Regeln plus KI-gestützte Transkript-Selects: aus jeder Langform-Folge entstehen 3–6 Hochkant-Shorts. Die KI schlägt vor, der Schnitt entscheidet.',
			en: 'Rules plus AI-assisted transcript selects turn every long-form episode into 3–6 vertical shorts. AI suggests, the edit decides.',
		},
	},
	{
		n: '05',
		title: { de: 'Review-Schleife', en: 'Review loop' },
		text: {
			de: 'Frame.io-Kommentare werden zu strukturierten Änderungslisten. Weniger Korrekturrunden, keine verlorenen Notizen.',
			en: 'Frame.io comments become structured change lists. Fewer revision rounds, no lost notes.',
		},
	},
	{
		n: '06',
		title: { de: 'SOP & Übergabe', en: 'SOP & handover' },
		text: {
			de: 'Ein Dokument, mit dem jede Editorin und jeder Editor in eurem Team das System bedienen kann. Kein Lock-in – das System gehört euch.',
			en: 'One document any editor on your team can follow. No lock-in: the system belongs to you.',
		},
	},
];

export const proof: { title: L; tag: L; text: L; named?: boolean }[] = [
	{
		title: { de: 'Carwow DE – Review-Folgen', en: 'Carwow DE – review episodes' },
		tag: { de: 'Format-Schnitt · 2025', en: 'Format edit · 2025' },
		text: {
			de: 'Schnitt von drei Auto-Review-Folgen im bestehenden Carwow-Format: Struktur, Grafik-Beats und Pacing exakt nach Vorgabe, in Serie produziert.',
			en: 'Edited three car-review episodes inside the existing Carwow format: structure, graphic beats and pacing to spec, produced as a series.',
		},
		named: true,
	},
	{
		title: { de: 'D2C-Produktmarke – modulare Ad-Library', en: 'D2C product brand – modular ad library' },
		tag: { de: 'Dreh + Schnitt · 2026', en: 'Shoot + edit · 2026' },
		text: {
			de: 'Ein Drehtag, geplant als Baukasten: Hook-Bank, Vorher/Nachher mit identischem Framing und Installations-Clips für 50+ Ads, 4 YouTube-Anleitungen und ein Founder-Q&A.',
			en: 'One shoot day planned as a kit: hook bank, before/after with matched framing and installation clips for 50+ ads, 4 YouTube how-tos and a founder Q&A.',
		},
	},
	{
		title: { de: 'Podcast-Produktion – Workflow-Setup', en: 'Podcast production – workflow setup' },
		tag: { de: 'Workflow-Coaching · 2025', en: 'Workflow coaching · 2025' },
		text: {
			de: 'DaVinci-Resolve-Projekttemplate, Multicam-Workflow, Farbmanagement und Shortcut-Set für eine wöchentliche Podcast-Produktion – aufgesetzt und übergeben.',
			en: 'DaVinci Resolve project template, multicam workflow, colour management and shortcut set for a weekly podcast, set up and handed over.',
		},
	},
	{
		title: { de: 'Langform-Dokus mit 1,2 und 1,4 Mio. Aufrufen', en: 'Long-form docs with 1.2M and 1.4M views' },
		tag: { de: 'Doku-Schnitt · YouTube', en: 'Doc edit · YouTube' },
		text: {
			de: 'Gedreht und geschnitten für Felix von der Laden. Der Beweis, dass System und Storytelling sich nicht ausschließen.',
			en: 'Shot and edited for Felix von der Laden. Proof that systems and storytelling are not opposites.',
		},
		named: true,
	},
];

export const tools: { name: string; text: L }[] = [
	{
		name: 'Offload',
		text: {
			de: 'Eigene macOS-App für Karten-Offload und Ingest mit Prüfsummen – weil Datenverlust kein Workflow-Problem sein darf.',
			en: 'My own macOS app for checksum-verified card offload and ingest, because data loss should never be a workflow problem.',
		},
	},
	{
		name: 'Remotion',
		text: {
			de: 'Programmatische Grafik-Templates: Specs und Vergleiche kommen aus der Tabelle, nicht aus Handarbeit.',
			en: 'Programmatic graphics templates: specs and comparisons come from the spreadsheet, not from hand-keying.',
		},
	},
	{
		name: 'DaVinci Resolve & Premiere',
		text: {
			de: 'Templates, Multicam, Farbmanagement und Export-Presets für beide Systeme.',
			en: 'Templates, multicam, colour management and export presets for both.',
		},
	},
	{
		name: 'Frame.io',
		text: {
			de: 'Review-Schleife mit strukturierten Änderungslisten.',
			en: 'Review loop with structured change lists.',
		},
	},
];

export const faq: { q: L; a: L }[] = [
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
		q: { de: 'Premiere oder DaVinci Resolve?', en: 'Premiere or DaVinci Resolve?' },
		a: {
			de: 'Beides. Ich baue im System, das ihr schon nutzt.',
			en: 'Both. I build in whatever your team already uses.',
		},
	},
	{
		q: { de: 'Wie startet eine Zusammenarbeit?', en: 'How do we start?' },
		a: {
			de: 'Mit einem 15-Minuten-Call und dann meist dem bezahlten Pilot: eine Folge plus drei Shorts zum Festpreis, voll anrechenbar.',
			en: 'A 15-minute call, then usually the paid pilot: one episode plus three shorts at a fixed price, fully credited.',
		},
	},
	{
		q: { de: 'Wo sitzt du?', en: 'Where are you based?' },
		a: {
			de: 'Ich arbeite remote und reise viel; Kommunikation auf Deutsch oder Englisch, Abrechnung über Micha Roessler LLC. Für B2B-Kunden in der EU gilt Reverse-Charge.',
			en: 'I work remotely and travel a lot; communication in German or English, invoicing via Micha Roessler LLC. EU B2B clients are invoiced under reverse charge.',
		},
	},
];
