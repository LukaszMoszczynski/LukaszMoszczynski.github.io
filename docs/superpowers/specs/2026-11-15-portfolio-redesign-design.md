# Portfolio redesign — design

Date: 2026-11-15 · Owner: Łukasz Moszczyński · Repo: `LukaszMoszczynski/LukaszMoszczynski.github.io` (branch `redesign`)

## 1. Intent

Łukasz's only portfolio is a 2019 jQuery/Bootstrap page from his bootcamp days. Since then he went from Junior Frontend Developer to **Technical Leader at home.pl**, builds design systems, WordPress shops and AI agents that automate testing and development. The new site replaces the old one at `https://lukaszmoszczynski.github.io/`.

**Who it's for:** clients (Polish small businesses, like the DCC training company or the Omelański site) and recruiters (often technical, often Polish, sometimes international).

**What success looks like:** within the first seconds a visitor feels the site was made by someone who really knows what they're doing, and is impressed. The motion and interaction are the proof: the site itself is the first case study. A technical visitor who opens DevTools or runs Lighthouse should find clean, fast, accessible work underneath.

**The story the site tells:** 11.5 years leading a team at Castorama → first line of code in October 2017 → Junior at home.pl in 2019 → Technical Leader in 2024 → today: frontend, design systems and AI agents that automate the work. Leadership + frontend craft + AI automation is the rare combination; the site should make that obvious.

## 2. Goals, non-goals, anti-goals

**Goals**
- Heavy, interactive, polished animation that invites the visitor to play (owner explicitly wants *more* interaction, not less).
- Polish and English, dark and light mode, both first-class.
- One case-study page per project; adding a project later = adding content files, not editing layout code.
- Hosted on GitHub Pages from this repo.

**Non-goals**
- No CMS, no backend, no contact form service, no analytics (for now).
- No blog.
- Updating the LinkedIn profile (owner will do it later).

**Anti-goals (failure even if it "works")**
- Animation that feels clunky, laggy or janky — smoothness matters more than quantity.
- Content hidden or unreadable when motion is reduced, JS fails or on a phone.
- Template-looking design, generic "AI site" look.
- Showing anything from home.pl beyond descriptions (see §6).
- Weak "facts" padded into counters (owner rejected "4 projects / 66 tokens / 2 languages").

## 3. Constraints

- **Hosting:** GitHub Pages, user site → served at the domain root (`base: '/'`). Deployed by GitHub Actions on push to `master`.
- **Stack (decided by owner):** Astro, static output. GSAP (+ ScrollTrigger) for all animation — GSAP is the owner's tool of choice; components must degrade gracefully without it and respect `prefers-reduced-motion`.
- **Old site must be kept** (see §9).
- **Code conventions (owner's standing rules):** readable names in new code (`element`, `index`, `project`, never `e`, `i`, `p`); no `Co-Authored-By`/model trailers in commits.
- **home.pl work:** descriptions only — no screenshots, code, names of internal systems or data. The work was sold to home.pl; the ideas are his.

## 4. Visual direction

The reference is the published spike **"Combined Portfolio Concept"** (concept D): https://claude.ai/artifact/UHnoYZsgSuz9e8XkCXM9J8. A copy of its HTML is committed as `docs/superpowers/specs/2026-11-15-concept-d-spike.html` — treat it as a throwaway prototype for look and behaviour, not as code to port line by line. The spike is known to have clunky animation timing; polishing is part of the build.

**Palette** (from the owner's Figma "Atomic Design" file, DCC tokens, fileKey `JfRuc3T6MhLuse40bo2g9W`, node `95:645`):

| Token | Light | Dark |
|---|---|---|
| bg | `#f8f6fb` | `#0d0a15` |
| surface | `#ffffff` | `#1a1429` |
| ink (text) | `#2a1d4d` (DCC brand ink `#372662` family) | `#f4f0fb` |
| muted | `#6b5f8a` | `#a99bc9` |
| accent (orange) | `#eb6126` | `#f07a3e` |
| violet | `#7b5bd6` | `#8f70ea` |
| line / grid | `#e3deef` / `#e9e4f2` | `#2a2140` / `#1b1528` |
| selection blue (Figma frame look) | `#1269b0` | `#5aa7e6` |

Dark is the hero look (screenshots the owner liked are dark), but light must be just as designed.

**Type:** Unbounded (variable, wght 200–900 — needed for the cursor-weight effect) for display; Manrope for body; IBM Plex Mono for labels/code. Self-host via Fontsource (no Google Fonts request).

## 5. Page structure and behaviour (home page)

Sections in order. "Liked" = owner explicitly approved in the spike.

1. **Global background (liked).**
   - Fixed blueprint **grid** (96 px cells) behind the whole page. On first load the lines draw in quickly.
   - **Tracers:** at any moment ~3 short stretches (2–4 cells) of random grid lines are drawn by a glowing orange point, then fade; infinite, only a few at a time.
   - **Hover cell:** the cell under the pointer glows faintly orange (not over content).
   - **Click burst:** clicking empty grid sends four tracers out from the nearest crossing with a ring pulse.
   - **Cursor light (liked, "awesome"):** soft orange + purple glow following the pointer with lag, across the whole page (not only the hero). On touch devices it drifts slowly by itself.
2. **Header:** logo "ŁM.", links (Work, Contact), language switch, theme switch. Floating pill style from the spike.
3. **Hero (liked).** Eyebrow "Frontend developer · Poland · open to projects" (builder may update to include "Technical Leader"); the name "Łukasz / Moszczyński" huge, second line orange; **letters get heavier near the pointer** (variable weight). Letters rise in on load. Below: claim "I build interfaces that move with intent." + one-line sub about frontend, design systems and AI + "↳ click the grid" hint.
4. **"From token to page" (liked "when the frame is animated").** Pinned section: left the steps 01 Atoms / 02 Molecules / 03 Organisms / 04 Pages; right a Figma-like dashed frame where token pieces (colors, type, spacing, radius) assemble into a button, a card, then a page. Must be **fast** (owner: "should go way faster") — short pin, snappy snapping. **Clicking 01–04 jumps to that step.**
5. **Statement (animation liked, old text rejected):** big text that lights up word by word on scroll. Text: "For eleven years I ran a team on a shop floor. In 2017 I wrote my first line of code. Today I'm a Technical Leader at home.pl and I teach AI agents to do the boring parts of the job." (+ PL.)
6. **Career path:** vertical timeline that draws itself on scroll, a glowing point travels down and lights each step: 2007 Castorama deputy manager (11.5 years) · 2012 Computer science, ZUT Szczecin (2012–2014) · 2017 first line of code (bootcamp) · 2019 Junior Frontend Developer, home.pl · 2021 Frontend Developer · 2022 Software Engineer · 2024 Technical Leader · now: design systems, shops, AI agents. The 2017 step links to the archived 2019 portfolio ("my first portfolio").
7. **Stack.** Heading "Frontend is one half. The other half is AI."
   - Wide **AI & automation** card: description of the QA agent and the semi-dark factory (see §6) + interactive **agent log**: chips (QA agent / Dark factory / Figma → code) replay a terminal-style run line by line. Numbers in the logs are illustrative and must read as an example.
   - Cards: **Frontend** (HTML, CSS, JavaScript, TypeScript, Tailwind, styled-components, Astro, GSAP, Squidex CMS, accessibility), **Design systems** (multi-brand, Figma variables, tokens, Storybook, atomic design), **WordPress & e-commerce** (block themes, WooCommerce, PHP, Przelewy24).
8. **Recommendations:** LinkedIn quotes in a draggable card deck (drag/throw a card aside, or press Next; keyboard accessible). Quotes stay in English original in both languages, with name, role, year:
   - Aleksandra Zalewska, Senior Frontend Developer, home.pl, 2023 — "Łukasz demonstrated a superb understanding of frontend technologies and the ability to create innovative solutions. His programming skills are impeccable."
   - Szymon Papis, Software Developer, 2023 — "I was impressed with Łukasz's attention to detail, professionalism, and ability to deliver high-quality code within tight deadlines."
   - Dawid Krajewski, Co-Founder @ Sherlo (formerly home.pl), 2022 — "He's also a fast learner and by over two years of our collaboration, he made huge progress… an awesome person with super positive vibes who you simply cannot dislike."
9. **Selected work (liked "depth stack" feel):** sticky stacked cards; each card shrinks/dims as the next slides over; the project visual tilts in 3D under the pointer. Each card links to its case study.
10. **Contact:** huge line "Let's build something." that fills with orange on scroll; email `moszczynski.luk@gmail.com` and phone `+48 880 944 496` shown as selectable text with copy buttons (and `mailto:`/`tel:` links); buttons LinkedIn and GitHub; footer. Owner decided: email and phone both public, no form.

**Rejected in the spikes — do not use:** horizontal pinned project rail, velocity skill marquee, the "kinetic" concept as a whole (only its name-hover survived), counters. Magnetic buttons and a custom cursor were rejected here too (owner reversed 2026-11-16).

## 6. Projects and case studies

Each project = one content entry per language (Astro content collection) with: slug, title, one-line summary, tags, card visual, order, and a case-study body. Case study page `/work/<slug>/` (and `/pl/work/<slug>/`): hero with title + summary + tags, the problem, what he built, technical highlights, what he'd show off (motion/interaction where it fits), links (live site / repo where public), next-project link.

| Slug | Project | Public links | What to stress |
|---|---|---|---|
| `dcc` | DCC Grygorcewicz — training company site | live site when public | WordPress block theme from Figma, WooCommerce shop, **own Przelewy24 payment plugin**, PDF e-vouchers, Swup page transitions, GSAP |
| `design-system` | Design System | github.com/LukaszMoszczynski/design-system + its GitHub Pages | Figma-synced multi-brand tokens, HTML/CSS/JS components, Storybook |
| `wp-starter` | WP Starter | github.com/LukaszMoszczynski/wp-starter | starter block theme, sections from Figma, design-system tokens |
| `omelanski` | Omelański | omelanski.pl | static Astro site, multiple domains with redirects, hosting hand-off |
| `qa-agent` | QA agent (home.pl) | none — description only | Claude writes test scenarios (Markdown) + Playwright specs for new features, runs master vs working branch, compares screenshots, comments on the GitLab merge request, produces a full HTML report |
| `dark-factory` | Semi-dark factory (home.pl) | none — description only | Jira label triggers a factory in local Docker → agent solves the task → pushes to GitLab → his own auto-reviewer comments → factory picks up comments and fixes → loop until clean; a human makes the final call |

**Factory loop animation (owner approved):** the `dark-factory` case study (and, in a compact form, its card visual) gets an interactive pipeline: Jira label → factory (local Docker) → GitLab push → auto-reviewer → comments → back to factory, ending in "review clean · ready for a human". A task "ticket" travels around the loop; the visitor clicks the label (or a "Run" button) to start a run and watches it go round 1–2 review cycles. Keyboard-operable; with reduced motion it shows the loop as a static labelled diagram.

The two home.pl entries carry a short note: built at home.pl, shown as a description of the idea only. Their visuals are illustrative diagrams/animations, never screenshots.

Source material for case-study text: the owner's local repos (`E:/projekty/dcc-grygorcewicz`, `design-system`, `wp-starter`, `omelanski`) and the descriptions above. The builder drafts copy; the owner reviews it.

## 7. Languages, themes, accessibility, performance

- **Languages:** Astro i18n routing, English at `/`, Polish at `/pl/`; switch keeps the current page; `hreflang` alternates; all UI strings in a dictionary file; project content per locale.
- **Themes:** follows system by default; toggle overrides and is remembered (localStorage); theme set before first paint (no flash).
- **Reduced motion / no JS:** every piece of content is visible and readable; grid static, no tracers, no glow following, pinned sections become normal sections showing their final state, deck becomes a plain list or Next-button only.
- **Touch:** everything works by tap; pointer-only effects get a touch alternative or are skipped.
- **Accessibility:** semantic landmarks, visible focus, all interactive pieces keyboard-operable (steps, chips, deck), decorative layers `aria-hidden`, colour contrast AA in both themes.
- **Performance:** animation must stay smooth (60 fps target on a mid laptop); only transform/opacity/clip-path in hot paths; GSAP loaded as a module; fonts self-hosted and subset to Latin + Latin Extended (Polish).
- **SEO/sharing:** title/description per page and locale, Open Graph image, sitemap.

## 8. Engineering

- Astro (current stable), TypeScript, plain CSS with custom-property tokens (no Tailwind requirement), GSAP + ScrollTrigger from npm.
- Page transitions between home and case studies: Astro view transitions, with GSAP/ScrollTrigger cleaned up and re-initialised per page.
- Tests: Playwright smoke tests (both locales, both themes, reduced motion, phone width, no console errors, no horizontal overflow) + `astro check` + build in CI before deploy.
- Deploy: GitHub Actions → GitHub Pages (Pages source switched from branch to Actions when the redesign is merged).

## 9. Preview, keeping the old site, launch

**Preview while building (builder's call, owner may override):** work in progress is deployed from the `redesign` branch to a temporary public repo **`portfolio-preview`** → `https://lukaszmoszczynski.github.io/portfolio-preview/`. Therefore `base` is configurable from day one: every internal link, asset, i18n route, `hreflang` and sitemap entry goes through Astro's base URL. The live root site stays untouched during the build. `portfolio-preview` is deleted after launch.

**Old site:** moves first (before launch) to a new public repo **`portfolio-2019`** (same files, favicon paths made relative because they are root-absolute today), published at `https://lukaszmoszczynski.github.io/portfolio-2019/`. The current `master` is tagged `v2019`. The new site links to it from the 2017 timeline step.

**Who does it:** the builder performs all GitHub actions with the owner's logged-in `gh` CLI (create repos, enable Pages, tag, push, merge, switch Pages source to Actions) — owner approved.

**Launch:** only when the owner explicitly says "go" after reviewing the preview: merge `redesign` → `master`, switch this repo's Pages source to GitHub Actions, verify the root site and `/portfolio-2019/`.

## 10. Left to the builder

- Exact animation timings, easing and the polish of every effect (the owner will review on the live preview).
- Case-study page layout details and copy drafts (owner reviews).
- Project card visuals (abstract illustrations in the palette are fine; real screenshots of DCC, design system, WP Starter and Omelański may be used — they are the owner's own work).
- Whether to add smooth scrolling (Lenis) — only if it makes the pinned sections feel better.
- 404 page in the same style.
