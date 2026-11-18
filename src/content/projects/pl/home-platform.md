---
title: Wielomarkowe strony sprzedażowe z jednego kreatora stron
short: Platforma home.pl
client: home.pl
summary: "Strony sprzedażowe 8 marek grupy hostingowej: ponad 700 landing pages, które redaktorzy składają z gotowych sekcji w CMS-ie, a buduje je Gatsby."
meta: Gatsby · CMS · wiele marek
tags: [Gatsby, GraphQL, Squidex, React, Redux, styled-components, Tailwind, Storybook, Weblate, Playwright, Biome, Multi-brand]
order: 4
visual: home-platform
team: true
links:
  - label: home.pl
    href: https://home.pl/
  - label: az.pl
    href: https://az.pl/
---

## Problem

Zespół frontendu home.pl buduje strony marketingowe i sprzedażowe wielomarkowej grupy hostingowej: home.pl, az.pl, strefa.pl oraz IONOS w Rumunii, Bułgarii, Czechach, Słowacji i na Węgrzech. Każda marka potrzebuje landing pages, ofert i ścieżek sprzedaży, a strony składają redaktorzy, nie programiści.

## Co zbudowaliśmy

- **Treści w headless CMS, strony z Gatsby.** Prawie wszystko, co widać na tych stronach, siedzi w CMS-ie, a Gatsby generuje z tego strony przez GraphQL.
- **Uniwersalny kreator stron.** Redaktor składa stronę w CMS-ie z zestawu gotowych sekcji, a Gatsby buduje ją dla każdej marki.
- **Ponad 700 landing pages w 8 markach**, a za nimi ścieżki sprzedaży: upselle, koszyki i konfiguratory produktów.
- **Nowy CMS i więcej marek.** W 2019 była jedna marka IONOS, a treści leżały w Contentfulu. Potem przeszły do Squidexa, a strony obsługują dziś 8 marek.
- **Biblioteka frontendu w trakcie zmiany.** Biblioteka na styled-components była już w 2019, razem z Gatsby; przez lata z niej korzystaliśmy i ją rozbudowywaliśmy. Teraz przechodzimy na Tailwinda i własną bibliotekę budowaną z tokenów z Figmy, ze Storybookiem i motywami dla wielu marek, tak jak w moim [design systemie](../design-system/).

## Najważniejsze

- Strony składają redaktorzy, nie programiści: wybierają w CMS-ie gotowe sekcje, a Gatsby buduje stronę dla każdej marki.
- Ścieżki sprzedaży są częścią tego samego systemu: upselle, koszyki i konfiguratory produktów na drodze od landing page do zamówienia.
- Wdrażałem nowych pracowników w projekt.
- Na tym systemie stoi moja praca z AI: [agent QA](../qa-agent/) i [automatyczny proces z człowiekiem w pętli](../delivery-loop/). Proces działa na moim skillu „resolve ticket”, który krok po kroku czyta Figmę i tworzy komponenty i sekcje w Tailwindzie.
