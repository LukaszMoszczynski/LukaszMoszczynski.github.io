---
title: Fast static company website
short: Omelański
summary: A fast static Astro site for a property management company, with several domains redirected to one address and a package ready to upload to the client's hosting.
meta: Astro · static site
tags: [Astro, TypeScript, SEO, Accessibility, Playwright]
order: 7
visual: omelanski
links:
  - label: omelanski.pl
    href: https://omelanski.pl
  - label: GitHub Pages preview
    href: https://lukaszmoszczynski.github.io/omelanski-site/
---

## Problem

A property management company needed a new site on a new domain. The old domain still had visitors, and a client portal on one of its subdomains had to stay where it was. The site had to run on ordinary shared hosting, without a build server.

## What I built

- A **static Astro site**: every page is pre-rendered HTML, with page changes that don't reload the whole page.
- **Domains and redirects:** the `www` and `.com` variants answer with a 301 to the same path on the main domain, and each page of the old site redirects to its new match, leaving the portal subdomain alone. The rules are generated at build time.
- A **hosting hand-off:** the built site and the redirect files are uploaded as they are, with written steps for whoever does the upload.

## Highlights

- Canonical links, the sitemap, structured data, `llms.txt` and the share image all take their address from one setting.
- One test command runs the type check, unit tests, the build, a link check, and browser and accessibility tests.
- A GitHub Pages preview let the client click through the site before launch.
