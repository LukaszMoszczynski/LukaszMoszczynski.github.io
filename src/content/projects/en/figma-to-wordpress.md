---
title: Figma to WordPress starter
short: Figma → WordPress
summary: A tool that reads a Figma site file built from my component library and turns it into a working local WordPress site with design-system components and brand tokens.
meta: WordPress · Figma · automation
tags: [WordPress, Figma, Claude Code, Docker, Node.js, Playwright]
order: 6
visual: figma-to-wordpress
links:
  - label: GitHub repository
    href: https://github.com/LukaszMoszczynski/wp-starter
---

## Problem

Starting a WordPress site from a Figma design took days of the same setup: Docker, plugins, tokens, the first blocks. When the design is built from a shared component library, most of that work can be read from the file itself.

## What I built

- A **Claude Code skill**, `/new-site`, that reads the Figma file through the Figma MCP: its pages and sections, the library components, the brand, and features such as a shop or forms.
- A **recipe** (`site.recipe.json`) that records what was found. Nothing is created until the owner confirms it.
- **Node scripts** that build a local Docker WordPress site from the recipe alone, with the **design-system components and the brand's tokens**, seed the pages and run the site's Playwright suite.

## Highlights

- It stops early and says why: a missing component (with its Figma link), an unknown brand, or page slugs WordPress can't use.
- Plugins are vetted before install: an approved list, recent updates and a security feed check.
- The scripts read only the recipe and never call Figma, so a site can be rebuilt without Claude.
