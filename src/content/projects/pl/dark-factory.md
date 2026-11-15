---
title: Półciemna fabryka
summary: Etykieta w Jirze uruchamia lokalną fabrykę, w której agent rozwiązuje zadanie, auto-reviewer komentuje merge request, a pętla kręci się, aż review będzie czyste. Ostatnie słowo należy do człowieka.
meta: AI · agenci · proces
tags: [Claude, Docker, GitLab, Jira, Code review]
order: 4
visual: dark-factory
links: []
origin: home.pl
---

## Problem

Wiele zadań jest małych i dobrze opisanych, ale każde i tak wymaga, żeby ktoś je wziął, napisał zmianę, poczekał na review i poprawił komentarze. Chciałem, żeby takie zadania trafiały do programisty już zrobione i przejrzane, a decyzja dalej zostawała po stronie człowieka.

## Co zbudowałem

„Półciemną” fabrykę: działa sama, ale przy ostatnim kroku światło zostaje zapalone.

1. **Etykieta w Jirze** wysyła zadanie do fabryki, która działa w **lokalnym Dockerze**.
2. **Agent rozwiązuje zadanie** i **wypycha je do GitLaba**.
3. Mój własny **auto-reviewer** czyta merge request i zostawia komentarze.
4. Fabryka **pobiera komentarze i je poprawia**, a review rusza od nowa.
5. Pętla trwa, aż review będzie czyste. Wtedy **człowiek przegląda pracę i decyduje**.

## Najważniejsze

- Cała siła jest w pętli: agent nie kończy na pierwszej wersji, tylko odpowiada na uwagi z review tak, jak zrobiłby to programista.
- Wszystko działa lokalnie w Dockerze i startuje od etykiety, której zespół i tak już używa.
- Fabryka nigdy sama nie merguje. Przygotowuje pracę, a decyzję podejmuje człowiek.
