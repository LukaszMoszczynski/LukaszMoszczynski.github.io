# Łukasz Moszczyński · portfolio

Personal site of Łukasz Moszczyński: Technical Leader at home.pl and Staff Software Engineer at IONOS, working on multi-brand sites, design systems and AI agents.

**Live:** https://lukaszmoszczynski.github.io/ (English) · https://lukaszmoszczynski.github.io/pl/ (Polish)
**Previous site (2019):** https://lukaszmoszczynski.github.io/portfolio-2019/

## What's on the site

- **Hero:** the name reacts to the cursor; click the blueprint grid for a burst of tracers.
- **Career path:** from retail to Technical Leader, lit up as you scroll.
- **Stack:** frontend, design systems, WordPress and an AI card with a live agent log.
- **Recommendations:** a deck of LinkedIn recommendations you can drag, click or move with the arrow keys.
- **Selected work:** stacked case cards. Every project has its own animated picture, and the same animation is used on the home card, the `/work/` list and the case page.
- **Case studies:** AI QA agent, human-in-the-loop delivery, multi-brand design system, the home.pl multi-brand platform, a WordPress shop, a Figma → WordPress starter and an Astro company site.

Dark theme by default, with a light theme. Everything is in English and Polish, and switching language keeps your place on the page.

## Stack

- [Astro](https://astro.build/), static output, content collections, view transitions
- [GSAP](https://gsap.com/) with ScrollTrigger for all motion
- TypeScript, plain CSS with design tokens (`src/styles/tokens.css`)
- Vitest (unit) and Playwright (e2e, desktop 1440×900 and phone 360×740)
- `@axe-core/playwright` for the WCAG 2.2 AA audit

## Accessibility and motion

- WCAG 2.2 AA: every page is audited with axe in both themes, on desktop and phone, at the top and after scrolling.
- Full keyboard support, including the recommendations deck and the stacked work cards. Focus rings are visible, and focused elements are never hidden under the header.
- A "Pause animations" switch in the footer and the menu stops everything that moves on its own. `prefers-reduced-motion` is respected.
- The custom cursor appears only with a fine pointer and motion allowed. Otherwise the native cursor stays.
- An e2e check fails on any console warning or error.

## Project structure

```
src/
  components/     Astro components (Hero, Stack, WorkStack, ProjectVisual, …)
  content/
    projects/en/  case studies in English (one .md per project)
    projects/pl/  the same case studies in Polish
  content.config.ts  schema for case studies
  i18n/           UI strings (ui.ts) and language helpers
  layouts/        BaseLayout, CaseStudyLayout
  pages/          routes: / and /pl/, /work/ and /work/<slug>/, 404
  scripts/        GSAP setups, one module per section; lifecycle.ts runs them per page
    visuals/      the animated story of each project picture
  styles/         tokens.css (colours, type, spacing), global.css
tests/
  unit/           Vitest
  e2e/            Playwright, including a11y.spec.ts (axe) and console.spec.ts
```

## Running it

Requires Node 22 and npm 11.

```bash
npm ci
npm run dev        # http://localhost:4321/
npm run check      # astro check (types)
npm test           # unit tests
npm run build      # static site in dist/
npm run test:e2e   # builds and runs Playwright
```

The site can be built under a sub-path with `BASE_PATH`, for example `BASE_PATH=/portfolio-preview/ npm run build`. The e2e suite runs against that preview path. On Windows, set it from PowerShell (`$env:BASE_PATH='/portfolio-preview/'`): Git Bash rewrites values that start with `/`.

## Adding a case study

1. Add `src/content/projects/en/<slug>.md` and `src/content/projects/pl/<slug>.md`. The front matter follows `src/content.config.ts`: `title` (what was delivered), `short`, `client`, `summary`, `meta`, `tags`, `order`, `visual`, `links`.
2. Add a picture for it: put the drawing in `ProjectVisual.astro`, write its story in `src/scripts/visuals/<slug>.ts`, register it in `stories.ts`, and add the slug to `VISUALS` in `content.config.ts`.
3. The home stack, `/work/`, the menu and the case page pick it up automatically, sorted by `order`.

## Deployment

| Branch | Workflow | Where |
|---|---|---|
| `redesign`, `master` (push and PR) | `ci.yml` | check, unit and e2e tests |
| `redesign` | `preview.yml` | https://lukaszmoszczynski.github.io/portfolio-preview/ |
| `master` | `deploy.yml` | https://lukaszmoszczynski.github.io/ (tests must pass first) |

GitHub Pages is set to deploy from GitHub Actions.

## Content

The texts, case studies and images are © Łukasz Moszczyński. The home.pl AI projects (QA agent, human-in-the-loop delivery) are shown as descriptions of the idea only.
