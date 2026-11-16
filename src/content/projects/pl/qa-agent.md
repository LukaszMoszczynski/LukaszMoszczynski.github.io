---
title: Agent QA
summary: Agent AI, który do nowej funkcji pisze scenariusze testów i specy Playwright, porównuje gałąź z masterem i zostawia wynik w merge requeście.
meta: AI · testy · automatyzacja
tags: [Claude, Playwright, GitLab, Testy wizualne]
order: 1
visual: qa-agent
links: []
origin: home.pl
---

## Problem

Każda nowa funkcja potrzebuje testów i uważnego sprawdzenia, co zmieniło się na ekranie. Ręczne pisanie scenariuszy i speców oraz porównywanie zrzutów ekranu zajmuje dużo czasu i to właśnie ta część pracy wypada, kiedy goni termin.

## Co zbudowałem

Agenta opartego na Claude, ze skillami i instrukcjami, które sam napisałem. Bierze nową funkcję i robi rutynową część QA:

- pisze **scenariusze testów** w Markdownie, zrozumiałe dla każdego w zespole;
- zamienia je na **specy Playwright**;
- uruchamia je na **masterze i na gałęzi roboczej** i porównuje zrzuty ekranu;
- dodaje **komentarz w merge requeście w GitLabie** z tym, co znalazł;
- tworzy **pełny raport HTML** ze scenariuszami, wynikami i różnicami wizualnymi.

## Najważniejsze

- Najpierw scenariusze, zwykłym językiem, żeby człowiek mógł sprawdzić, jak agent zrozumiał zadanie, zanim zaufa jego testom.
- Porównanie mastera z gałęzią pokazuje, co zmiana faktycznie zrobiła, a nie tylko czy testy przechodzą.
- Wynik trafia tam, gdzie zespół już pracuje: do merge requesta.
