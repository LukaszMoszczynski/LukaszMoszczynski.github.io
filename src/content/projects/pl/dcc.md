---
title: Sklep WordPress z płatnościami online
short: DCC Grygorcewicz
client: DCC Grygorcewicz
summary: Motyw blokowy WordPressa zbudowany z Figmy dla firmy szkoleniowej, ze sklepem WooCommerce, własną wtyczką płatności Przelewy24 i e-voucherami w PDF.
meta: WordPress · sklep · płatności
tags: [WordPress, WooCommerce, PHP, Przelewy24, GSAP, Swup, Playwright]
order: 5
visual: dcc
links:
  - label: Wersja testowa
    href: http://test.lotusblanc.eu/
---

## Problem

DCC Grygorcewicz prowadzi szkolenia, sprzedaje testy takie jak Gallup, sesje i konsultacje. Potrzebowali nowej strony zgodnej z projektem w Figmie i sklepu, w którym można zapłacić online i dostać fakturę bez ręcznego przepisywania danych. Stroną zarządzają osoby, które nie są programistami, więc panel musiał być prosty i trudny do zepsucia.

## Co zbudowałem

- **Motyw blokowy** WordPressa zrobiony z projektu w Figmie. Każda sekcja strony to blok z własnymi polami, a kolory i rozmiary pisma pochodzą z jednego zestawu tokenów w `theme.json`.
- **Sklep WooCommerce** na blokowym koszyku i kasie: zakupy bez zakładania konta, rodzaje produktów opisane w jednej liście, ceny brutto/netto z najniższą ceną z 30 dni, koszyk w wysuwanym panelu i lista oczekujących na szkolenia bez terminu.
- **Własną bramkę Przelewy24** jako osobną wtyczkę, zamiast płatnej. Ma tryby symulacji, sandboksa i produkcji, a tryby testowe nie uruchomią się na publicznej stronie.
- **Karty podarunkowe jako e-vouchery w PDF**, wysyłane mailem dopiero po potwierdzeniu płatności.
- Automatyczne faktury po opłaceniu zamówienia, wyszukiwanie firmy po NIP i kafelek „stan sklepu”, który pokazuje, która integracja działa jeszcze w trybie testowym.
- Uproszczony panel: w menu jest tylko to, czego klient używa, a stron systemowych i kluczowych wtyczek nie da się przypadkiem usunąć.

## Najważniejsze

- Przejścia między stronami bez przeładowania dzięki **Swup** i animacje przy przewijaniu w **GSAP**, które respektują ograniczony ruch. Bez JavaScriptu treść dalej jest czytelna.
- Zestaw testów **Playwright**, który sprawdza konkretne wartości CSS każdego bloku, oraz porównanie każdej sekcji z jej ramką w Figmie.
- Wdrożenie na hosting bez SSH: motyw, baza i nowe zdjęcia pakowane są lokalnie, a na serwerze rozpakowują je jednorazowe skrypty chronione tokenem, które potem same się usuwają.
