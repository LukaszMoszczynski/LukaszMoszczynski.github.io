---
title: Multi-brand design system synced with Figma
short: Design system
summary: A multi-brand design system where Figma variables are the source of truth, built into CSS tokens, HTML/CSS/JS components and a Storybook on GitHub Pages.
meta: Tokens · components · Storybook
tags: [Design tokens, Figma, Style Dictionary, Storybook, CSS, JavaScript, GSAP]
order: 3
visual: design-system
links:
  - label: GitHub repository
    href: https://github.com/LukaszMoszczynski/design-system
  - label: Storybook
    href: https://lukaszmoszczynski.github.io/design-system/
---

## Problem

Every client site started with the same work: copy colours and sizes from Figma, rebuild a button, a card and a header, and keep them in step when the design changed. Two brands meant doing it twice. I wanted one place where a change in Figma becomes a change in code.

## What I built

- **Tokens synced from Figma.** A script reads the Figma variables (primitives, light and dark themes, desktop and mobile breakpoints, component aliases) and writes them as DTCG token files. A check makes sure every alias resolves and every brand has the same tokens, then Style Dictionary builds the CSS.
- **Two brands, two themes** from the same components: brand and theme are switched with a `data-` attribute on `<html>`.
- **Components in plain HTML, CSS and JavaScript**, organised as atoms, molecules, organisms and sections, so they can be pasted into a WordPress block or any other stack. No package to install.
- **Storybook** with a playground and docs for each component, deployed to GitHub Pages on every push. "Show code" gives the exact HTML a site pastes.

## Highlights

- Motion uses **GSAP** when it is on the page and still works without it; every script skips animation under reduced motion.
- Each component script exposes `init(root)` and marks what it has handled, so it can run again after a page swap without binding twice.
- CI renders every story and runs an accessibility check before the Storybook is published.
