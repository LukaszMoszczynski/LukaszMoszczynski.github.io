---
title: Design System
summary: Design system dla wielu marek, w którym źródłem prawdy są zmienne w Figmie, a z nich powstają tokeny CSS, komponenty HTML/CSS/JS i Storybook na GitHub Pages.
meta: Tokeny · komponenty · Storybook
tags: [Design tokens, Figma, Style Dictionary, Storybook, CSS, JavaScript, GSAP]
order: 2
visual: design-system
links:
  - label: Repozytorium na GitHubie
    href: https://github.com/LukaszMoszczynski/design-system
  - label: Storybook
    href: https://lukaszmoszczynski.github.io/design-system/
---

## Problem

Każda strona dla klienta zaczynała się od tego samego: przepisać kolory i rozmiary z Figmy, zbudować od nowa przycisk, kartę i nagłówek, a potem pilnować, żeby nadążały za zmianami w projekcie. Przy dwóch markach wszystko dwa razy. Chciałem mieć jedno miejsce, w którym zmiana w Figmie staje się zmianą w kodzie.

## Co zbudowałem

- **Tokeny synchronizowane z Figmą.** Skrypt czyta zmienne z Figmy (prymitywy, motyw jasny i ciemny, breakpointy desktop i mobile, aliasy komponentów) i zapisuje je jako pliki tokenów DTCG. Kontrola sprawdza, czy każdy alias się rozwiązuje i czy każda marka ma te same tokeny, a potem Style Dictionary buduje CSS.
- **Dwie marki i dwa motywy** na tych samych komponentach: markę i motyw przełącza atrybut `data-` na `<html>`.
- **Komponenty w czystym HTML, CSS i JavaScripcie**, ułożone jako atomy, molekuły, organizmy i sekcje, więc da się je wkleić do bloku WordPressa albo do dowolnego innego stacku. Bez paczki do instalowania.
- **Storybook** z playgroundem i dokumentacją każdego komponentu, publikowany na GitHub Pages po każdym pushu. „Show code” daje dokładnie ten HTML, który wkleja strona.

## Najważniejsze

- Animacje korzystają z **GSAP**, jeśli jest na stronie, a bez niego wszystko dalej działa; przy ograniczonym ruchu każdy skrypt pomija animację.
- Skrypt każdego komponentu ma `init(root)` i oznacza obsłużone elementy, więc po podmianie strony można go wywołać ponownie bez podwójnego podpinania.
- CI renderuje każdą story i sprawdza dostępność, zanim Storybook trafi na Pages.
