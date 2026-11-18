---
title: Szybka statyczna strona firmowa
short: Omelański
client: Omelański
summary: Szybka statyczna strona w Astro dla firmy zarządzającej nieruchomościami, z kilkoma domenami przekierowanymi na jeden adres i paczką gotową do wgrania na hosting klienta.
meta: Astro · strona statyczna
tags: [Astro, TypeScript, SEO, Dostępność, Playwright]
order: 7
visual: omelanski
links:
  - label: omelanski.pl
    href: https://omelanski.pl
  - label: Podgląd na GitHub Pages
    href: https://lukaszmoszczynski.github.io/omelanski-site/
---

## Problem

Firma zarządzająca nieruchomościami potrzebowała nowej strony pod nową domeną. Stara domena wciąż miała ruch, a panel dla klientów na jednej z jej subdomen musiał zostać tam, gdzie był. Strona miała działać na zwykłym hostingu współdzielonym, bez serwera do budowania.

## Co zbudowałem

- **Statyczną stronę w Astro**: każda podstrona to gotowy HTML, a przejścia między nimi nie przeładowują całej strony.
- **Domeny i przekierowania:** wersje z `www` i `.com` odpowiadają przekierowaniem 301 na ten sam adres w głównej domenie, a każda podstrona starej witryny prowadzi do swojego odpowiednika, bez ruszania subdomeny z panelem. Reguły powstają przy budowaniu.
- **Przekazanie na hosting:** zbudowaną stronę i pliki z przekierowaniami wgrywa się bez zmian, według spisanych kroków dla osoby, która to robi.

## Najważniejsze

- Linki kanoniczne, sitemapa, dane strukturalne, `llms.txt` i obrazek do udostępniania biorą adres z jednego ustawienia.
- Jedna komenda testów uruchamia sprawdzenie typów, testy jednostkowe, build, sprawdzenie linków oraz testy w przeglądarce i dostępności.
- Podgląd na GitHub Pages pozwolił klientowi przeklikać stronę przed startem.
