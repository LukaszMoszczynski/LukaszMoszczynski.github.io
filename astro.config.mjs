import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Case studies were renamed to match their titles (2026-11-21). Old addresses keep working:
// each one redirects to its new page (old CVs, LinkedIn posts and shared links still land right).
const base = process.env.BASE_PATH ?? '/';
const renamedCaseStudies = {
  dcc: 'wordpress-shop',
  omelanski: 'company-website',
  'wp-starter': 'figma-to-wordpress',
  'home-platform': 'multi-brand-sites',
  'delivery-loop': 'human-in-the-loop',
};
const redirects = Object.fromEntries(Object.entries(renamedCaseStudies).flatMap(([from, to]) => [
  [`/work/${from}/`, `${base}work/${to}/`],
  [`/pl/work/${from}/`, `${base}pl/work/${to}/`],
]));

export default defineConfig({
  redirects,
  site: 'https://lukaszmoszczynski.github.io',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'pl'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', pl: 'pl' } } })],
});
