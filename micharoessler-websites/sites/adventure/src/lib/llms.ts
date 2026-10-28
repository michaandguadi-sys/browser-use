// /llms.txt and /llms-full.txt (https://llmstxt.org): a plain-text map of the whole domain for AI assistants.
// Built from the same data as the pages – facts only. Formatschnitt's offer is imported from sites/systems so prices
// can never drift from what that section shows (the deploy build mounts the whole sites/ folder for this).
// Note: importing that file makes Vite read sites/systems/tsconfig.json, so run `npm ci` in sites/systems before
// building this site (deploy/vps-deploy.sh builds systems first).
import { projects } from '../data/projects';
import { faq } from '../data/faq';
import { factsOf } from '../data/facts';
import { timelineOf } from '../data/timeline';
import { href, ORIGIN } from '../i18n';
import { offer, packages, how, faq as fsFaq, meta as fsMeta, contact as fsContact, hero as fsHero } from '../../../systems/src/data/content';

const abs = (p: string) => `${ORIGIN}${p}`;
const de0 = (n: number) => `${n.toLocaleString('de-DE')} €`;
const en0 = (n: number) => `€${n.toLocaleString('en-GB')}`;
const FS = { de: abs('/formatschnitt/'), en: abs('/formatschnitt/en/') };

const intro = () =>
	[
		'# Micha Rössler',
		'',
		'> German expedition & documentary filmmaker, camera operator and documentary editor (micharoessler.com, English with German at /de/). Under the name Formatschnitt he also offers a monthly video editing retainer for companies with a recurring YouTube show (micharoessler.com/formatschnitt/, German with English at /formatschnitt/en/). Works in German and English; invoices through his own US company, Micha Roessler LLC (Sheridan, Wyoming). Contact: hello@micharoessler.com.',
		'',
		...factsOf('en').map(([k, v]) => `- ${k}: ${v}`),
	].join('\n');

const filmPages = () =>
	[
		'## Expedition & documentary film (micharoessler.com)',
		'',
		`- [Home](${abs(href('en', 'home'))}): Expedition & adventure filmmaker for outdoor brands, expedition teams and tourism boards – mountain film, camera operator, documentary editing, destination films. German: ${abs(href('de', 'home'))}`,
		`- [Work](${abs(href('en', 'work'))}): All projects – expedition films, documentaries, destination and hospitality films.`,
		...projects.map((p) => `- [${p.title.en}](${abs(href('en', p.slug))}): ${p.kicker.en}${p.year ? `, ${p.year}` : ''}. ${p.summary.en}`),
		`- [About](${abs(href('en', 'about'))}): Background, timeline and where Micha has filmed.`,
		`- [Contact](${abs(href('en', 'contact'))}): Shoot requests – reply within two working days.`,
	].join('\n');

const fsSection = () => {
	const perEp = Math.round(offer.aboM.price / offer.aboM.episodes / 10) * 10;
	return [
		'## Formatschnitt – video editing retainer for company YouTube shows (micharoessler.com/formatschnitt/)',
		'',
		`- [Formatschnitt (German)](${FS.de}): ${fsMeta.description.de}`,
		`- [Formatschnitt (English)](${FS.en}): ${fsMeta.description.en}`,
		'',
		`How Formatschnitt works: a company's recurring YouTube show is set up once as an editing system (structure, look, titles, graphics); Micha then edits finished episodes with ${offer.shortsPerEpisode} shorts each, every month, to that standard – at a fixed monthly price, from about ${en0(perEp)} per episode. The client sends footage and approves; feedback comes as one list. Remote, in German or English.`,
		'',
		'Prices (EUR, net; invoiced by Micha Roessler LLC, EU B2B: reverse charge):',
		...packages.map((p) => `- ${p.name.en}: ${en0(p.amount)} ${p.unit.en}${p.note ? ` (${p.note.en})` : ''} – ${p.points.map((x) => x.en).join('; ')}`),
		`- More episodes or social media support: on request. From about ${en0(perEp)} per episode on plan M.`,
		'',
		'Steps:',
		...how.steps.map((s, i) => `${i + 1}. ${s.title.en}: ${s.text.en}`),
		'',
		`Reference: ${fsHero.proof.en.link} – review series, 2025 (${fsHero.proof.href}).`,
		`Getting started: ${fsContact.steps.en} ${fsContact.risk.en} ${fsContact.remote.en}`,
		`Deutsch: Formatschnitt – YouTube-Videos schneiden lassen, Cutter für YouTube-Formate von Unternehmen. Preise netto: Pilot ${de0(offer.pilot)}, Setup ${de0(offer.setup)} einmalig, Folgen-Abo S ${de0(offer.aboS.price)}/Monat (${offer.aboS.episodes} Folgen), Folgen-Abo M ${de0(offer.aboM.price)}/Monat (${offer.aboM.episodes} Folgen).`,
	].join('\n');
};

const contactSection = () =>
	[
		'## Contact',
		'',
		'- Email: hello@micharoessler.com (film and Formatschnitt) – reply within two working days.',
		'- Languages: German, English. Works remotely and on location worldwide.',
		`- Profiles: https://www.instagram.com/michaaroessler/ · https://www.youtube.com/@GuadiandMicha`,
	].join('\n');

export const llmsTxt = () =>
	[
		intro(),
		filmPages(),
		fsSection(),
		contactSection(),
		[
			'## Optional',
			'',
			`- [llms-full.txt](${abs('/llms-full.txt')}): Everything above plus project details, timeline and both FAQs.`,
			`- [Imprint](${abs(href('en', 'imprint'))}) · [Privacy](${abs(href('en', 'privacy'))})`,
			`- Sitemaps: ${abs('/sitemap-index.xml')} · ${abs('/formatschnitt/sitemap-index.xml')}`,
		].join('\n'),
	].join('\n\n') + '\n';

export const llmsFullTxt = () =>
	[
		intro(),
		filmPages(),
		[
			'## Projects in detail',
			...projects.map((p) =>
				[
					'',
					`### ${p.title.en} (${abs(href('en', p.slug))})`,
					`${p.kicker.en} · ${p.location.en}${p.year ? ` · ${p.year}` : ''} · Role: ${p.roles.en}${p.client ? ` · Client: ${p.client}` : ''}`,
					...p.body.map((b) => b.en),
					...p.facts.map((f) => `- ${f.label.en}: ${f.value.en}`),
					...(p.youtube ? [`- Video: https://www.youtube.com/watch?v=${p.youtube}`] : []),
				].join('\n'),
			),
		].join('\n'),
		['## Timeline', '', ...timelineOf('en').map(([y, t]) => `- ${y}: ${t}`)].join('\n'),
		['## FAQ – film', '', ...faq.map((f) => `Q: ${f.q.en}\nA: ${f.a.en}\n`)].join('\n'),
		fsSection(),
		['## FAQ – Formatschnitt', '', ...fsFaq.map((f) => `Q: ${f.q.en}\nA: ${f.a.en}\n`)].join('\n'),
		contactSection(),
	].join('\n\n') + '\n';
