# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2019 page at lukaszmoszczynski.github.io with a heavily animated, interactive Astro portfolio (EN/PL, dark/light) with six case studies, previewed on a sub-path until the owner says "go".

**Architecture:** Static Astro site, one `BaseLayout` with fixed background layers (grid + cursor light) and Astro view transitions. Every section is an `.astro` component plus a small TypeScript module registered through one page-lifecycle helper that creates and tears down GSAP/ScrollTrigger work per page. Pure logic (grid geometry, deck order, factory sequence, i18n paths, theme resolution) lives in plain TS modules with unit tests; behaviour is checked with Playwright against a production build served under `/portfolio-preview/`.

**Tech Stack:** Astro (current stable, static output), TypeScript, GSAP + ScrollTrigger (npm), Fontsource (`@fontsource-variable/unbounded`, `@fontsource-variable/manrope`, `@fontsource/ibm-plex-mono`), `@astrojs/sitemap`, Vitest, Playwright, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-15-portfolio-redesign-design.md` (visual reference: `docs/superpowers/specs/2026-11-15-concept-d-spike.html` — throwaway prototype; take states, copy and behaviour from it, not code structure).

## Global Constraints

- Base path configurable: `base: process.env.BASE_PATH ?? '/'`, `site: 'https://lukaszmoszczynski.github.io'`, `trailingSlash: 'always'`. No root-absolute internal URL anywhere; always go through `import.meta.env.BASE_URL` / `localizePath`.
- English at `/`, Polish at `/pl/` (Astro i18n, `prefixDefaultLocale: false`).
- Theme follows system by default; toggle stored in `localStorage` key `theme`; applied before first paint via `data-theme` on `<html>`.
- All animation via GSAP; everything readable with `prefers-reduced-motion: reduce`, without JS, and at 360 px width; no horizontal page scroll.
- Only transform / opacity / clip-path animated in hot paths; target 60 fps.
- Palette tokens exactly as spec §4 table; fonts Unbounded (display, variable 200–900), Manrope (body), IBM Plex Mono (labels).
- home.pl work: descriptions and illustrative visuals only — no screenshots, code, internal names.
- Readable names in new code (`element`, `index`, `project`, `event` — never `e`, `i`, `p`).
- Commits: no `Co-Authored-By` or model trailers.
- Rejected, never add: horizontal project rail, skill marquee, magnetic buttons, custom cursor dot, counters.
- Work on branch `redesign`; never push to `master` before the owner says "go" (Task 14).

## Review Focus

1. **Sub-path deploy:** every link, asset, font, `hreflang`, OG image and sitemap URL must work under `/portfolio-preview/` → Task 12 crawl test.
2. **View-transition navigation:** home → case study → back (repeated) must not duplicate ScrollTrigger pins, stack listeners or leave tracers running → Task 11 test.
3. **Narrow and resized windows:** 360 px width and a resize after load must not cause horizontal overflow or a stale grid/pin → Task 3 and Task 12 tests.
4. **Language switch on a case study** keeps the same project (`/work/dcc/` ↔ `/pl/work/dcc/`) → Task 2 unit + Task 11 e2e.
5. **Corrupt stored theme** (`localStorage.theme = 'blue'`) falls back to the system preference without a flash → Task 2 unit + e2e.

---

## File Structure

```
astro.config.mjs            base/site/i18n/sitemap
package.json                scripts: dev, build, preview, check, test, test:e2e
playwright.config.ts        builds with BASE_PATH=/portfolio-preview/, baseURL under it
vitest.config.ts
src/styles/tokens.css       palette + type tokens (light on :root, dark via media + [data-theme])
src/styles/global.css       reset, layout utilities (.wrap gutter), focus, reduced-motion
src/i18n/ui.ts              UI dictionary {en, pl}
src/i18n/utils.ts           Lang, getLang, t, localizePath, switchLangPath
src/scripts/theme.ts        resolveTheme, toggle
src/scripts/lifecycle.ts    onPage, prefersReducedMotion, hasFinePointer, gsap registration
src/scripts/grid.ts         pure grid geometry
src/scripts/background.ts   grid draw-in, tracers, hover cell, click burst, cursor light
src/scripts/name-weight.ts  weightForDistance + hero letter effect
src/scripts/token-build.ts  BUILD_STATES, stepScrollTop + pinned build section
src/scripts/words.ts        word-by-word statement
src/scripts/career-path.ts  timeline draw
src/scripts/agent-log.ts    AGENT_RUNS + chip replay
src/scripts/deck.ts         rotateDeck, cardPose, shouldDismiss + drag
src/scripts/work-stack.ts   sticky card shrink + tilt
src/scripts/contact.ts      fill line + copy buttons (copyText)
src/scripts/factory-loop.ts factorySequence + interactive loop
src/components/*.astro      Header, LangSwitch, ThemeToggle, Background, Hero, TokenBuild, Statement,
                            CareerPath, Stack, AgentLog, Recommendations, WorkStack, ProjectVisual,
                            Contact, Footer, FactoryLoop, Seo
src/layouts/BaseLayout.astro
src/layouts/CaseStudyLayout.astro
src/content.config.ts       projects collection
src/content/projects/{en,pl}/{dcc,design-system,wp-starter,omelanski,qa-agent,dark-factory}.md
src/pages/index.astro, src/pages/pl/index.astro
src/pages/work/[slug].astro, src/pages/pl/work/[slug].astro
src/pages/404.astro
public/og.png, public/favicon.svg
tests/unit/*.test.ts, tests/e2e/*.spec.ts
.github/workflows/ci.yml, preview.yml, deploy.yml
```

Each section component renders complete, readable HTML at rest; its script only adds motion. A section script exports `init<Name>(root: HTMLElement): () => void` (returns cleanup) and is registered with `onPage`.

---

### Task 1: Scaffold, tokens, i18n utilities

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `src/styles/tokens.css`, `src/styles/global.css`, `src/i18n/ui.ts`, `src/i18n/utils.ts`, `.gitignore` (replace old one; keep `node_modules`, `dist`, `.astro`, `test-results`, `playwright-report`)
- Delete from branch: old site files `index.html`, `css/`, `js/`, `sass/`, `images/`, `package-lock.json` (they live on in tag `v2019` and in `portfolio-2019`, Task 13)
- Test: `tests/unit/i18n.test.ts`

**Interfaces:**
- Produces: `type Lang = 'en' | 'pl'`; `getLang(url: URL): Lang`; `t(lang: Lang, key: UiKey): string`; `localizePath(path: string, lang: Lang): string` (input is a site path without base and without `/pl`, e.g. `'/work/dcc/'`; output includes base, e.g. `'/portfolio-preview/pl/work/dcc/'`); `switchLangPath(url: URL, target: Lang): string`; `type UiKey = keyof typeof ui.en`.

- [ ] **Step 1: Scaffold** — `npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git` on branch `redesign`, then `npm i gsap @fontsource-variable/unbounded @fontsource-variable/manrope @fontsource/ibm-plex-mono @astrojs/sitemap` and `npm i -D vitest @playwright/test`. Scripts: `check: astro check`, `test: vitest run`, `test:e2e: playwright test`.
- [ ] **Step 2: Config** — `astro.config.mjs` per Global Constraints plus `i18n: { defaultLocale: 'en', locales: ['en', 'pl'], routing: { prefixDefaultLocale: false } }`, `integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', pl: 'pl' } } })]`. `playwright.config.ts`: `webServer.command = 'npm run build && npm run preview -- --port 4321'` with `env: { BASE_PATH: '/portfolio-preview/' }`, `use.baseURL = 'http://localhost:4321/portfolio-preview/'`, projects `desktop` (1440×900) and `phone` (360×740, `hasTouch: true`).
- [ ] **Step 3: Tokens** — `tokens.css` with the spec §4 palette as `--bg --surface --card --ink --muted --dim --accent --violet --line --grid --select --glow-a --glow-b --on-accent` (light on `:root`; dark under `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`; spike `:root` block has the exact values) and `--font-display/--font-body/--font-mono`. `global.css`: box-sizing, `.wrap` (max-width 1240px, side padding `max(16px, env(safe-area-inset-*))`), `:focus-visible` accent outline, `body { overflow-x: hidden }`.
- [ ] **Step 4: Dictionary** — `ui.ts` with every UI string from the spike in `en` and `pl` (nav, eyebrow, claim, sub, grid hint, build kicker/heading/steps, statement, path heading and entries, stack heading and card texts, chip labels, recommendations heading/hint/next, work heading, case-study CTA, contact line, copy/copied, footer, theme/lang aria labels, home.pl note "Built at home.pl — shown as a description of the idea only." / "Zbudowane w home.pl — pokazane wyłącznie jako opis pomysłu."). Statement copy is fixed by spec §5.5; path entries by §5.6; eyebrow EN: "Technical Leader · Frontend developer · Poland", PL: "Technical Leader · Frontend developer · Polska".
- [ ] **Step 5: Write failing tests** `tests/unit/i18n.test.ts`:

```ts
// BASE_URL stubbed to '/portfolio-preview/' via vi.stubEnv / import.meta.env
expect(getLang(new URL('https://x.dev/portfolio-preview/pl/work/dcc/'))).toBe('pl');
expect(getLang(new URL('https://x.dev/portfolio-preview/work/dcc/'))).toBe('en');
expect(localizePath('/', 'en')).toBe('/portfolio-preview/');
expect(localizePath('/work/dcc/', 'pl')).toBe('/portfolio-preview/pl/work/dcc/');
expect(switchLangPath(new URL('https://x.dev/portfolio-preview/work/dcc/'), 'pl')).toBe('/portfolio-preview/pl/work/dcc/');
expect(switchLangPath(new URL('https://x.dev/portfolio-preview/pl/'), 'en')).toBe('/portfolio-preview/');
expect(Object.keys(ui.pl).sort()).toEqual(Object.keys(ui.en).sort()); // no missing translations
```

- [ ] **Step 6: Run** `npm test` → FAIL (functions missing). **Implement** `utils.ts`. **Run** `npm test` → PASS; `npm run check` → 0 errors.
- [ ] **Step 7: Commit** `feat: scaffold Astro site with tokens and i18n utilities`

### Task 2: Base layout, header, theme and language switch

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `ThemeToggle.astro`, `LangSwitch.astro`, `Footer.astro`, `src/scripts/theme.ts`, `src/scripts/lifecycle.ts`, `src/pages/index.astro`, `src/pages/pl/index.astro` (placeholders rendering the hero heading only)
- Test: `tests/unit/theme.test.ts`, `tests/e2e/shell.spec.ts`

**Interfaces:**
- Consumes: Task 1 i18n.
- Produces: `BaseLayout` props `{ lang: Lang; title: string; description: string; path: string }` (path = site path without base/lang, used for alternates); `resolveTheme(stored: string | null, systemDark: boolean): 'light' | 'dark'`; `THEME_KEY = 'theme'`; `onPage(setup: () => (() => void) | void): void` (runs on `astro:page-load`, cleanup on `astro:before-swap`); `prefersReducedMotion(): boolean`; `hasFinePointer(): boolean`; `motionEnabled(): boolean` (= GSAP loaded && !reduced).

- [ ] **Step 1: Failing unit tests** `theme.test.ts`: `resolveTheme('dark', false) === 'dark'`; `resolveTheme('light', true) === 'light'`; `resolveTheme(null, true) === 'dark'`; `resolveTheme('blue', false) === 'light'`.
- [ ] **Step 2: Failing e2e** `shell.spec.ts`: (a) clicking theme toggle sets `html[data-theme]` to the opposite of the emulated scheme and it survives reload; (b) with `localStorage.theme='blue'` and `colorScheme: 'dark'`, `html` computed background equals dark `--bg` `rgb(13, 10, 21)` at first paint; (c) lang switch on `/` goes to `pl/` and `<html lang="pl">`; (d) header links resolve under `/portfolio-preview/`.
- [ ] **Step 3: Run** both → FAIL.
- [ ] **Step 4: Implement.** Layout: `<html lang>`, inline `is:inline` theme script in `<head>` using the same rule as `resolveTheme`, Fontsource imports, `ClientRouter` from `astro:transitions`, `<link rel="alternate" hreflang>` for en/pl/x-default, skip link, slots, `Footer`. Header = floating pill nav from the spike (logo "ŁM." + Work + Contact + lang + theme). `lifecycle.ts` registers `ScrollTrigger` once and kills all triggers created during a page in the cleanup.
- [ ] **Step 5: Run** `npm test && npm run test:e2e -- shell` → PASS.
- [ ] **Step 6: Commit** `feat: base layout with theme and language switching`

### Task 3: Background — grid, tracers, click burst, cursor light

**Files:**
- Create: `src/scripts/grid.ts`, `src/scripts/background.ts`, `src/components/Background.astro` (included in `BaseLayout`, `transition:persist`)
- Test: `tests/unit/grid.test.ts`, `tests/e2e/background.spec.ts`

**Interfaces:**
- Produces: `CELL = 96`; `gridLines(width: number, height: number, cell?: number): { columns: number[]; rows: number[]; offsetX: number }` (columns from `offsetX = (width % cell) / 2` step `cell` ≤ width; rows from `cell` step `cell` ≤ height); `nearestCrossing(x: number, y: number, lines): { x: number; y: number }` (y candidates include 0); `cellOrigin(x: number, y: number, lines): { x: number; y: number }`; `initBackground(): () => void`.

- [ ] **Step 1: Failing unit tests:** `gridLines(1000, 400).offsetX === 20`, `.columns[0] === 20`, `.columns.at(-1) === 980`, `.rows` equals `[96,192,288,384]`; `nearestCrossing(70, 40, lines)` → `{x: 20, y: 0}`; `cellOrigin(130, 100, lines)` → `{x: 116, y: 96}`.
- [ ] **Step 2: Failing e2e:** (a) after load + 2.5 s at least one `.grid-layer .dot` exists and never more than 4 tracer lines at once (sample 5×); (b) clicking an empty point on the hero background adds 4 traces + 1 `.ring`; (c) clicking a link does not; (d) with `reducedMotion: 'reduce'` no `.dot` ever appears and grid lines are visible; (e) phone project: after `page.setViewportSize({width: 360, height: 740})` then resize to 800 wide, `document.documentElement.scrollWidth <= clientWidth`.
- [ ] **Step 3: Run** → FAIL. **Implement** per spec §5.1 and spike: draw-in on first load only (staggered `scaleY`/`scaleX`, ≤1.2 s total), 3 concurrent infinite tracers (2–4 cells, speed 160 px/s, glowing `.dot`), hover cell (pointer fine only, hidden over `a, button, [role=button], .stage, .project-card, .skill, .quote, header`), click burst (4 directions, 3 cells, ring pulse), cursor light = fixed `.light-layer` with two blurred radial glows (`quickTo` 1.6 s / 2.6 s), drifting `yoyo` on touch. Rebuild grid on resize (debounced 150 ms). Persisted across view transitions; must not restart draw-in on navigation.
- [ ] **Step 4: Run** → PASS. **Commit** `feat: interactive blueprint grid and cursor light`

### Task 4: Hero with pointer-weighted name

**Files:**
- Create: `src/components/Hero.astro`, `src/scripts/name-weight.ts`; Modify: both `index.astro` pages
- Test: `tests/unit/name-weight.test.ts`, `tests/e2e/hero.spec.ts`

**Interfaces:**
- Produces: `weightForDistance(distance: number, radius = 260, min = 300, max = 900): number` (`Math.round(min + (max - min) * Math.max(0, 1 - distance / radius))`); `initHero(root: HTMLElement): () => void`.

- [ ] **Step 1: Failing tests:** `weightForDistance(0) === 900`, `weightForDistance(130) === 600`, `weightForDistance(400) === 300`. E2E: `h1` has accessible name "Łukasz Moszczyński"; hovering the first letter of "Moszczyński" makes its computed `font-weight` ≥ 800 and a letter of "Łukasz" ≤ 450; leaving restores 300.
- [ ] **Step 2: Run** → FAIL. **Implement:** eyebrow, name split into `.char` spans (aria-hidden lines, `aria-label` on `h1`), second line accent, claim with `<em>`, sub, grid hint, load sequence after grid draw-in (letters `yPercent 120 → 0`, stagger 0.035), lines drift apart on scroll (`xPercent -8 / 6`), rAF-throttled pointer weight on fine pointers only.
- [ ] **Step 3: Run** → PASS. **Commit** `feat: hero with pointer-reactive name`

### Task 5: "From token to page" pinned build

**Files:**
- Create: `src/components/TokenBuild.astro`, `src/scripts/token-build.ts`
- Test: `tests/unit/token-build.test.ts`, `tests/e2e/token-build.spec.ts`

**Interfaces:**
- Produces: `type PieceState = [left: number, top: number, width: number, height: number, radius: number]`; `BUILD_STATES: PieceState[][]` (4 states × 6 pieces in order page, violet, type, space, accent, radius — values copied from the spike `states` array); `stepScrollTop(start: number, end: number, index: number, count: number): number`; `initTokenBuild(root: HTMLElement): () => void`.

- [ ] **Step 1: Failing tests:** `BUILD_STATES.length === 4 && BUILD_STATES.every(state => state.length === 6)`; `stepScrollTop(1000, 2000, 2, 4)` ≈ `1666.67`. E2E: clicking step "03" (and Enter on focused "04") scrolls so the step gets class `on` within 1.5 s; with reduced motion the section is not pinned and shows state 4 (page) with all four steps readable.
- [ ] **Step 2: Run** → FAIL. **Implement:** steps are `<button>`s in an `<ol>`; pin `end: '+=110%'`, `scrub: 0.35`, snap to labels (0.2–0.5 s); pieces pop in once when entering; tags fade out and fills fade in on step 1→2; "Buy now"/"Kup teraz" label from dictionary.
- [ ] **Step 3: Run** → PASS. **Commit** `feat: pinned token-to-page build section`

### Task 6: Statement and career path

**Files:**
- Create: `src/components/Statement.astro`, `src/components/CareerPath.astro`, `src/scripts/words.ts`, `src/scripts/career-path.ts`
- Test: `tests/e2e/story.spec.ts`

**Interfaces:**
- Produces: `initStatement(root: HTMLElement): () => void`; `initCareerPath(root: HTMLElement): () => void`.

- [ ] **Step 1: Failing e2e:** statement is split into `.word` spans whose text joins to the dictionary statement; scrolling the statement through the viewport ends with every word at opacity 1; the timeline has 8 `li`; after scrolling to the end every `li` has class `lit`; the 2017 entry contains a link whose href ends with `/portfolio-2019/` and is absolute `https://lukaszmoszczynski.github.io/portfolio-2019/`; with reduced motion all `li` are fully opaque.
- [ ] **Step 2: Run** → FAIL. **Implement** per spec §5.5–5.6 and spike (opacity 0.18 → 1 scrub; progress line `scaleY` + glowing dot on the same trigger range `top 70%` → `bottom 55%`; `lit` on enter / removed on leave-back; heading sticky on desktop).
- [ ] **Step 3: Run** → PASS. **Commit** `feat: word-lit statement and career path`

### Task 7: Projects content and work stack

**Files:**
- Create: `src/content.config.ts`, `src/content/projects/{en,pl}/*.md` (12 files), `src/components/WorkStack.astro`, `src/components/ProjectVisual.astro`, `src/scripts/work-stack.ts`
- Test: `tests/unit/content.test.ts`, `tests/e2e/work.spec.ts`

**Interfaces:**
- Produces: collection `projects` (glob loader `src/content/projects/**/*.md`, id like `en/dcc`) with schema `{ title: string; summary: string; meta: string; tags: string[]; order: number; visual: 'dcc' | 'design-system' | 'wp-starter' | 'omelanski' | 'qa-agent' | 'dark-factory'; links: { label: string; href: string }[]; origin?: 'home.pl' }`; helper `getProjects(lang: Lang)` in `src/content/projects.ts` returning entries sorted by `order` with `slug` = file name; `ProjectVisual` props `{ visual: Project['visual']; compact?: boolean }`; `initWorkStack(root: HTMLElement): () => void`.

- [ ] **Step 1: Failing tests:** unit — `getProjects('en')` and `getProjects('pl')` return the same 6 slugs in order `dcc, design-system, qa-agent, dark-factory, wp-starter, omelanski`; both home.pl entries have `origin: 'home.pl'` and empty `links`. E2E — 6 `.project-card` articles, each with a link to `work/<slug>/`; hovering a visual on desktop gives it a non-identity `transform`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Write content.** Body sections `## Problem`, `## What I built`, `## Highlights` drafted from spec §6 table and the owner's repos (`E:/projekty/dcc-grygorcewicz`, `design-system`, `wp-starter`, `omelanski` — read their README/docs only). Links: design-system → `https://github.com/LukaszMoszczynski/design-system` + its Pages URL; wp-starter → repo; omelanski → `https://omelanski.pl`; dcc → none until the owner confirms a public URL. Copy is a draft for owner review; no invented metrics.
- [ ] **Step 4: Implement** sticky stacked cards (top 88/104/120… px, previous card `scale 0.92, opacity 0.55` scrubbed as the next arrives), 3D tilt ±14° on fine pointers; `ProjectVisual` = CSS/SVG illustrations in palette (dark-factory compact visual = small static loop diagram).
- [ ] **Step 5: Run** → PASS. **Commit** `feat: project content collection and stacked work cards`

### Task 8: Stack section with agent log

**Files:**
- Create: `src/components/Stack.astro`, `src/components/AgentLog.astro`, `src/scripts/agent-log.ts`
- Test: `tests/unit/agent-log.test.ts`, `tests/e2e/stack.spec.ts`

**Interfaces:**
- Produces: `type LogLine = { kind: 'comment' | 'step' | 'ok'; text: string }`; `AGENT_RUNS: Record<'qa' | 'factory' | 'figma', LogLine[]>` (lines from the spike's `runs`, first line of each a `comment`); `initAgentLog(root: HTMLElement): () => void`.

- [ ] **Step 1: Failing tests:** unit — each run starts with a `comment` and ends with an `ok`. E2E — default chip "QA agent" is `aria-pressed="true"` and the terminal shows its comment line; clicking "Dark factory" switches lines and pressed state; terminal has `aria-live="polite"`; the AI card links to `work/qa-agent/` and `work/dark-factory/`; with reduced motion all lines are visible without replay.
- [ ] **Step 2: Run** → FAIL. **Implement** spec §5.7 (heading, AI card spanning the row, three skill cards with the exact tag lists, illustrative-numbers caption "Example run" / "Przykładowy przebieg", replay loop 0.45 s per line, 2.5 s hold, restart on chip change, paused when off-screen).
- [ ] **Step 3: Run** → PASS. **Commit** `feat: stack section with interactive agent log`

### Task 9: Recommendations deck

**Files:**
- Create: `src/components/Recommendations.astro`, `src/scripts/deck.ts`
- Test: `tests/unit/deck.test.ts`, `tests/e2e/deck.spec.ts`

**Interfaces:**
- Produces: `rotateDeck<T>(order: T[]): T[]` (first → last, new array); `cardPose(index: number, count: number): { x: 0; y: number; scale: number; rotation: number; zIndex: number }` (`y = index * 16`, `scale = 1 - index * 0.05`, rotation 0 / −3 odd / 3 even, `zIndex = count - index`); `shouldDismiss(deltaX: number, threshold = 110): boolean` (`Math.abs(deltaX) > threshold`); `initDeck(root: HTMLElement): () => void`.

- [ ] **Step 1: Failing tests:** unit — `rotateDeck(['a','b','c'])` → `['b','c','a']`; `cardPose(1, 3)` → `{x:0, y:16, scale:0.95, rotation:-3, zIndex:2}`; `shouldDismiss(-111) === true`, `shouldDismiss(80) === false`. E2E — top card is Aleksandra Zalewska; dragging it 200 px right makes Szymon Papis the top card; a 50 px drag snaps back; pressing "Next" (keyboard Enter) advances; quotes are identical on `/pl/`.
- [ ] **Step 2: Run** → FAIL. **Implement** exact quotes/names/roles/years from spec §5.8 as `<figure><blockquote><figcaption>`; pointer capture drag, fly-out 0.35 s, elastic snap-back; `touch-action: pan-y`; without motion the Next button still cycles.
- [ ] **Step 3: Run** → PASS. **Commit** `feat: draggable recommendations deck`

### Task 10: Contact

**Files:**
- Create: `src/components/Contact.astro`, `src/scripts/contact.ts`
- Test: `tests/e2e/contact.spec.ts`

**Interfaces:**
- Produces: `copyText(text: string): Promise<boolean>` (clipboard, fallback to selecting the text node; resolves false on failure); `initContact(root: HTMLElement): () => void`.

- [ ] **Step 1: Failing e2e:** shows `moszczynski.luk@gmail.com` and `+48 880 944 496` as text with `mailto:` / `tel:+48880944496` links; clicking "Copy" (with clipboard permission granted) puts the email on the clipboard and the button reads "Copied" / "Skopiowano" for ~2 s; LinkedIn (`https://www.linkedin.com/in/%C5%82ukasz-moszczy%C5%84ski-764110161/`) and GitHub (`https://github.com/LukaszMoszczynski`) open in a new tab with `rel="noopener"`; the fill line ends with `--p: 100%` after scrolling to the bottom.
- [ ] **Step 2: Run** → FAIL. **Implement** spec §5.10. **Run** → PASS. **Commit** `feat: contact section with copyable email and phone`

### Task 11: Case study pages, view transitions, factory loop

**Files:**
- Create: `src/layouts/CaseStudyLayout.astro`, `src/pages/work/[slug].astro`, `src/pages/pl/work/[slug].astro`, `src/components/FactoryLoop.astro`, `src/scripts/factory-loop.ts`
- Test: `tests/unit/factory-loop.test.ts`, `tests/e2e/case-study.spec.ts`

**Interfaces:**
- Consumes: `getProjects`, `ProjectVisual`, `BaseLayout`, `onPage`.
- Produces: `type FactoryStage = 'label' | 'factory' | 'push' | 'review' | 'comments' | 'fix' | 'clean'`; `factorySequence(reviewCycles: number): FactoryStage[]`; `initFactoryLoop(root: HTMLElement): () => void`.

- [ ] **Step 1: Failing tests:** unit —

```ts
expect(factorySequence(0)).toEqual(['label','factory','push','review','clean']);
expect(factorySequence(1)).toEqual(['label','factory','push','review','comments','fix','push','review','clean']);
```

E2E — (a) every slug renders in both languages with title, summary, tags, the three body sections and a next-project link (last wraps to first); (b) lang switch on `work/dcc/` lands on `pl/work/dcc/`; (c) home.pl pages show the home.pl note and no `<img>`; (d) on `work/dark-factory/` clicking "Run" (or Enter on the Jira label) walks the ticket through stages and ends with "review clean · ready for a human" visible, the button disabled while running; with reduced motion the loop is a static labelled diagram listing all stages; (e) navigate home → `work/dcc/` → back → `work/omelanski/` → back three times: exactly one `.pin-spacer` for the token build, no console errors, tracer count still ≤ 4.
- [ ] **Step 2: Run** → FAIL. **Implement** case-study hero (title, summary, meta, tags, links, large `ProjectVisual`), prose from the markdown body, next-project link; `transition:name` on card visual ↔ case-study visual; factory loop per spec §6 (SVG ring of 6 nodes, ticket travels with GSAP, 1–2 random review cycles, keyboard-operable).
- [ ] **Step 3: Run** → PASS. **Commit** `feat: case study pages with view transitions and factory loop`

### Task 12: SEO, 404, cross-cutting checks

**Files:**
- Create: `src/components/Seo.astro`, `src/pages/404.astro`, `public/og.png` (1200×630, dark, name + "Technical Leader · Frontend · AI"), `public/favicon.svg` ("ŁM." mark); Modify: `BaseLayout.astro`
- Test: `tests/e2e/quality.spec.ts`

- [ ] **Step 1: Failing e2e:** (a) crawl every internal `href`/`src` on `/`, `/pl/` and all 12 case studies → each returns 200 and starts with `/portfolio-preview/`; (b) each page has unique `<title>`, meta description, `og:image` absolute URL, canonical and en/pl/x-default `hreflang`; (c) `sitemap-index.xml` lists URLs under `/portfolio-preview/`; (d) at 360 px, every page has `scrollWidth <= clientWidth`; (e) no console errors on any page; (f) with JavaScript disabled, every section's heading and text is visible on `/`; (g) `/missing/` serves the styled 404 with a link home.
- [ ] **Step 2: Run** → FAIL. **Implement.** **Run** `npm run check && npm test && npm run test:e2e` → all PASS.
- [ ] **Step 3: Commit** `feat: SEO metadata, 404 page and quality checks`

### Task 13: CI, preview deploy, archive the old site

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/preview.yml`, `.github/workflows/deploy.yml`

- [ ] **Step 1: Archive old site.** `git tag v2019 master && git push origin v2019`. Create public repo `LukaszMoszczynski/portfolio-2019` from `master`'s files (fresh clone of `master`, change the root-absolute favicon `href="/images/...` paths in `index.html` to relative), push to `main`, enable Pages: `gh api -X POST repos/LukaszMoszczynski/portfolio-2019/pages -f "source[branch]=main" -f "source[path]=/"`. Verify `https://lukaszmoszczynski.github.io/portfolio-2019/` returns 200 and its CSS/images load.
- [ ] **Step 2: CI** `ci.yml` on push/PR to `redesign` and `master`: Node 22, `npm ci`, `npm run check`, `npm test`, `npx playwright install --with-deps chromium`, `npm run test:e2e`.
- [ ] **Step 3: Preview.** Create public repo `LukaszMoszczynski/portfolio-preview` (README only). Generate an ed25519 key pair; `gh repo deploy-key add <pub> -R LukaszMoszczynski/portfolio-preview --allow-write -t preview-deploy`; `gh secret set PREVIEW_DEPLOY_KEY < <private>` on this repo; delete the local key files. `preview.yml` on push to `redesign`: build with `BASE_PATH=/portfolio-preview/`, deploy `dist` with `peaceiris/actions-gh-pages@v4` (`deploy_key`, `external_repository: LukaszMoszczynski/portfolio-preview`, `publish_branch: gh-pages`). Enable Pages on `portfolio-preview` from `gh-pages`.
- [ ] **Step 4: Deploy (inactive until launch).** `deploy.yml` on push to `master`: build with `BASE_PATH=/`, `actions/upload-pages-artifact` + `actions/deploy-pages`.
- [ ] **Step 5: Verify** — push `redesign`; CI green; `https://lukaszmoszczynski.github.io/portfolio-preview/` and `/portfolio-preview/pl/` load with styles, fonts and animations; the root site is still the 2019 page. **Commit** `ci: add checks, preview deploy and production deploy`

### Task 14: Launch — only after the owner says "go"

- [ ] **Step 1:** Stop and ask the owner to review the preview; apply requested polish as separate commits; wait for the explicit word "go".
- [ ] **Step 2:** Merge `redesign` → `master` (fast-forward or merge commit, no squash of history needed), push. Switch Pages source: `gh api -X PUT repos/LukaszMoszczynski/LukaszMoszczynski.github.io/pages -f build_type=workflow`. Re-run `deploy.yml` if it ran before the switch.
- [ ] **Step 3: Verify** `https://lukaszmoszczynski.github.io/`, `/pl/`, one case study, `/portfolio-2019/` all 200 with assets; Lighthouse (mobile) on `/` recorded in the PR/commit message.
- [ ] **Step 4:** Delete `portfolio-preview` repo only after the owner confirms (`gh repo delete` needs the `delete_repo` scope — ask the owner to run `gh auth refresh -s delete_repo` if missing), remove `preview.yml`, commit `chore: remove preview deploy`.
