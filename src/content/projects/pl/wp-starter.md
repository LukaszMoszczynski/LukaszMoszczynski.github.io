---
title: Starter Figma → WordPress
short: WP Starter
summary: Narzędzie, które czyta plik strony w Figmie zbudowany z mojej biblioteki komponentów i zamienia go w działającą lokalną stronę WordPress z komponentami i tokenami marki z design systemu.
meta: WordPress · Figma · automatyzacja
tags: [WordPress, Figma, Claude Code, Docker, Node.js, Playwright]
order: 5
visual: wp-starter
links:
  - label: Repozytorium na GitHubie
    href: https://github.com/LukaszMoszczynski/wp-starter
---

## Problem

Postawienie strony WordPress z projektu w Figmie zajmowało dni tej samej konfiguracji: Docker, wtyczki, tokeny, pierwsze bloki. Jeśli projekt jest zbudowany ze wspólnej biblioteki komponentów, większość tej pracy da się odczytać z samego pliku.

## Co zbudowałem

- **Skill do Claude Code**, `/new-site`, który czyta plik przez Figma MCP: strony i sekcje, komponenty z biblioteki, markę oraz funkcje takie jak sklep czy formularze.
- **Przepis** (`site.recipe.json`), w którym zapisuje to, co znalazł. Nic nie powstaje, dopóki właściciel go nie potwierdzi.
- **Skrypty w Node**, które z samego przepisu budują lokalną stronę WordPress w Dockerze, z **komponentami design systemu i tokenami marki**, wypełniają strony treścią i uruchamiają testy Playwright.

## Najważniejsze

- Zatrzymuje się wcześnie i mówi dlaczego: brakujący komponent (z linkiem do Figmy), nieznana marka albo adresy stron, których WordPress nie przyjmie.
- Wtyczki są sprawdzane przed instalacją: lista zatwierdzonych, świeże aktualizacje i baza znanych podatności.
- Skrypty czytają tylko przepis i nie odpytują Figmy, więc stronę można odbudować bez Claude.
