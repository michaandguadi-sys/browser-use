// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Formatschnitt lives as a section of micharoessler.com: https://micharoessler.com/formatschnitt/ (DE) and
// /formatschnitt/en/ (EN). nginx serves this build there (deploy/vps-deploy.sh). Every internal URL goes through
// `base` – use url() from src/i18n.ts (or import.meta.env.BASE_URL in client scripts), never a bare "/…" path.
export default defineConfig({
	site: 'https://micharoessler.com',
	base: '/formatschnitt',
	trailingSlash: 'always',
	i18n: {
		locales: ['de', 'en'],
		defaultLocale: 'de',
		routing: { prefixDefaultLocale: false },
	},
	integrations: [
		sitemap({
			i18n: { defaultLocale: 'de', locales: { de: 'de', en: 'en' } },
		}),
	],
	build: { inlineStylesheets: 'auto' },
});
