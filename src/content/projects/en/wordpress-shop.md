---
title: WordPress shop with online payments
short: WordPress shop
summary: A WordPress block theme built from Figma for a training company, with a WooCommerce shop, my own Przelewy24 payment plugin and PDF e-vouchers.
meta: WordPress · shop · payments
tags: [WordPress, WooCommerce, PHP, Przelewy24, GSAP, Swup, Playwright]
order: 5
visual: wordpress-shop
links:
  - label: Test version
    href: http://test.lotusblanc.eu/
---

## Problem

DCC Grygorcewicz runs trainings, sells tests such as Gallup, and offers sessions and consultations. They needed a new site that matched their Figma design, and a shop where people can pay online and get an invoice without anyone typing it by hand. The people running the site are not developers, so the admin had to be simple and hard to break.

## What I built

- A WordPress **block theme** made from the Figma design. Every page section is a block with its own fields, and colours and type sizes come from one set of tokens in `theme.json`.
- A **WooCommerce shop** on the block cart and checkout: guest checkout, product kinds defined in one list, gross/net prices with the lowest price from the last 30 days, a cart drawer and a waiting list for trainings without a date.
- **My own Przelewy24 gateway**, shipped as a separate plugin instead of a paid one. It has simulation, sandbox and production modes, and the test modes refuse to run on a public site.
- **Gift cards as PDF e-vouchers**, sent by email only after the payment is confirmed.
- Automatic invoices after payment, a company lookup by tax number, and a "shop status" tile that shows which integration still runs in test mode.
- A simplified admin panel: the menu shows only what the client uses, and system pages and key plugins can't be deleted by accident.

## Highlights

- Page changes without a reload through **Swup**, with **GSAP** scroll animation that respects reduced motion. Content stays readable without JavaScript.
- A **Playwright** suite that checks real CSS values of every block, plus a visual comparison of each section against its Figma frame.
- A deploy flow for hosting without SSH: the theme, the database and new images are packed locally and unpacked on the server by one-time, token-protected scripts that delete themselves.
