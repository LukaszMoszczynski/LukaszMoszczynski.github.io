---
title: Automatyczny proces z człowiekiem w pętli
client: home.pl
summary: Etykieta w Jirze przekazuje zadanie agentom w kontenerze Dockera. Rozwiązują je i w pętli poprawiają uwagi z review, aż będzie czyste, a potem człowiek przegląda pracę i ją merguje.
meta: AI · agenci · proces
tags: [Claude, Skille, Agenci, Docker, GitLab, Jira, Code review]
order: 2
visual: delivery-loop
links: []
origin: home.pl
---

## Problem

Wiele zadań jest małych i dobrze opisanych, ale każde i tak wymaga, żeby ktoś je wziął, napisał zmianę, poczekał na review i poprawił komentarze. Chciałem, żeby takie zadania trafiały do programisty już zrobione i przejrzane, a decyzja dalej zostawała po stronie człowieka.

## Co zbudowałem

Automatyczny proces dostarczania zmian z człowiekiem w pętli. Rutynową część robią agenci, a człowiek przegląda wynik i go merguje.

**Skille, instrukcje i agentów, dzięki którym to działa, napisałem sam.** Agenci działają na moim **skillu „resolve ticket”**, który idzie krok po kroku: czyta Figmę i tworzy komponenty i sekcje w Tailwindzie. Ten skill stoi na skillach zespołu, które opisują sposób pracy zespołu i jego dobre praktyki, więc agenci pracują tak, jak pracuje zespół.

1. **Etykieta w Jirze** przekazuje zadanie do **agentów w kontenerze Dockera**.
2. **Agenci rozwiązują zadanie** i **wypychają je do GitLaba**.
3. Mój własny **auto-reviewer** czyta merge request i zostawia komentarze.
4. Agenci **pobierają komentarze i je poprawiają**, a review rusza od nowa.
5. Pętla trwa, aż review będzie czyste. Wtedy **człowiek przegląda pracę i ją merguje**.

## Najważniejsze

- Cała siła jest w pętli: agenci nie kończą na pierwszej wersji, tylko odpowiadają na uwagi z review tak, jak zrobiłby to programista.
- Agenci trzymają się spisanego sposobu pracy zespołu, więc ich zmiany wyglądają jak zmiany zespołu.
- Wszystko działa w kontenerze Dockera i startuje od etykiety, której zespół i tak już używa. Proces uruchamiałem u siebie; obraz Dockera jest gotowy do uruchomienia na produkcji.
- Nic nie jest mergowane automatycznie. Agenci przygotowują pracę, a człowiek ją przegląda i merguje.
