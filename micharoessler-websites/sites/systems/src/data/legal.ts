// Shared legal copy (Impressum § 5 DDG, Datenschutz Art. 13 DSGVO). Not legal advice:
// have both texts checked (e.g. eRecht24 / IT-Recht Kanzlei generator) before going live.
// Identical file lives in both sites; edit both.

export const company = {
	name: 'Micha Roessler LLC',
	street: '30 N Gould St Ste N',
	city: 'Sheridan, WY 82801',
	country: { de: 'USA', en: 'USA' },
	rep: 'Micha Rössler',
	email: 'hello@micharoessler.com',
};

type Section = { h: string; p: string[] };

export const impressum: Record<'de' | 'en', Section[]> = {
	de: [
		{
			h: 'Angaben gemäß § 5 DDG',
			p: [
				`${company.name}<br>${company.street}<br>${company.city}<br>${company.country.de}`,
				`Vertreten durch das alleinige Mitglied (Managing Member): ${company.rep}`,
			],
		},
		{ h: 'Kontakt', p: [`E-Mail: <a href="mailto:${company.email}">${company.email}</a>`] },
		{
			h: 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV',
			p: [`${company.rep}, Anschrift wie oben`],
		},
		{
			h: 'Verbraucherstreitbeilegung',
			p: [
				'Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
			],
		},
		{
			h: 'Haftung für Inhalte und Links',
			p: [
				'Die Inhalte dieser Seite wurden mit Sorgfalt erstellt. Für Inhalte externer Links sind ausschließlich deren Betreiber verantwortlich; zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.',
			],
		},
		{
			h: 'Urheberrecht',
			p: [
				'Alle Fotos, Videos und Texte auf dieser Website sind urheberrechtlich geschützt. Verwendung nur nach schriftlicher Zustimmung.',
			],
		},
	],
	en: [
		{
			h: 'Legal notice (§ 5 DDG)',
			p: [
				`${company.name}<br>${company.street}<br>${company.city}<br>${company.country.en}`,
				`Represented by its sole member (managing member): ${company.rep}`,
			],
		},
		{ h: 'Contact', p: [`Email: <a href="mailto:${company.email}">${company.email}</a>`] },
		{ h: 'Responsible for content (§ 18 (2) MStV)', p: [`${company.rep}, address as above`] },
		{
			h: 'Copyright',
			p: ['All photos, videos and texts on this website are protected by copyright. Use only with written permission.'],
		},
	],
};

export const privacy = (host: string): Record<'de' | 'en', Section[]> => ({
	de: [
		{
			h: '1. Verantwortlicher',
			p: [
				`${company.name}, ${company.street}, ${company.city}, USA. Vertreten durch ${company.rep}. E-Mail: <a href="mailto:${company.email}">${company.email}</a>`,
			],
		},
		{
			h: '2. Kurz gesagt',
			p: [
				'Diese Website setzt keine Cookies, nutzt kein Tracking und keine Analyse-Tools. Schriften werden lokal ausgeliefert. Externe Inhalte (YouTube) werden erst nach deinem Klick geladen.',
			],
		},
		{
			h: '3. Hosting und Server-Logs',
			p: [
				`Die Website wird bei ${host} gehostet. Beim Aufruf verarbeitet der Hoster technisch notwendige Daten (IP-Adresse, Datum/Uhrzeit, aufgerufene Seite, Browser-Informationen) in Server-Logs, um die Seite sicher auszuliefern. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren Betrieb). Mit dem Hoster besteht ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO).`,
			],
		},
		{
			h: '4. Kontakt per E-Mail',
			p: [
				'Wenn du mir schreibst, verarbeite ich deine Angaben, um die Anfrage zu beantworten (Art. 6 Abs. 1 lit. b bzw. f DSGVO). E-Mails liegen bei Google Workspace. Die Daten werden gelöscht, sobald sie nicht mehr benötigt werden und keine gesetzlichen Aufbewahrungspflichten bestehen.',
			],
		},
		{
			h: '5. YouTube-Videos',
			p: [
				'Videos sind im erweiterten Datenschutzmodus (youtube-nocookie.com) eingebunden und werden erst geladen, wenn du auf „Abspielen“ klickst. Dann werden Daten an Google Ireland Ltd. bzw. Google LLC (USA) übertragen. Rechtsgrundlage ist deine Einwilligung durch den Klick (Art. 6 Abs. 1 lit. a DSGVO). Details: <a href="https://policies.google.com/privacy" rel="noopener">policies.google.com/privacy</a>.',
			],
		},
		{
			h: '6. Deine Rechte',
			p: [
				'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Eine formlose E-Mail genügt.',
			],
		},
	],
	en: [
		{
			h: '1. Controller',
			p: [
				`${company.name}, ${company.street}, ${company.city}, USA. Represented by ${company.rep}. Email: <a href="mailto:${company.email}">${company.email}</a>`,
			],
		},
		{
			h: '2. In short',
			p: [
				'This website sets no cookies and uses no tracking or analytics. Fonts are self-hosted. External content (YouTube) only loads after you click.',
			],
		},
		{
			h: '3. Hosting and server logs',
			p: [
				`This site is hosted by ${host}. When you visit, the host processes technically necessary data (IP address, date/time, requested page, browser information) in server logs to deliver the site securely. Legal basis: Art. 6(1)(f) GDPR. A data processing agreement (Art. 28 GDPR) is in place with the host.`,
			],
		},
		{
			h: '4. Contact by email',
			p: [
				'If you email me, I process your details to answer your request (Art. 6(1)(b) or (f) GDPR). Email is hosted by Google Workspace. Data is deleted when no longer needed and no retention duty applies.',
			],
		},
		{
			h: '5. YouTube videos',
			p: [
				'Videos use privacy-enhanced mode (youtube-nocookie.com) and only load after you click play. Data is then sent to Google Ireland Ltd. / Google LLC (USA). Legal basis: your consent by clicking (Art. 6(1)(a) GDPR).',
			],
		},
		{
			h: '6. Your rights',
			p: [
				'You have the right to access, rectification, erasure, restriction, portability and objection (Art. 15–21 GDPR) and to lodge a complaint with a supervisory authority. A short email is enough.',
			],
		},
	],
});
