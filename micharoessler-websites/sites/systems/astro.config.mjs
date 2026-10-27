// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
	site: 'https://formatschnitt.de',
	trailingSlash: 'always',
	i18n: {
		locales: ['de', 'en'],
		defaultLocale: 'de',
		routing: { prefixDefaultLocale: false },
	},
	integrations: [
		react(),
		sitemap({
			i18n: { defaultLocale: 'de', locales: { de: 'de-DE', en: 'en' } },
		}),
	],
	build: { inlineStylesheets: 'auto' },
});
