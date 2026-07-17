# Komentář změn — Hodnotitel maturitních slohů 1.5.1

Verze 1.5.1 nevypouští žádnou z oprav auditu 1.5.0. Jejím účelem je spojit auditní větev se společnou certifikační vrstvou ekosystému.

## Opravené regresní odchylky

1. Auditní ZIP neobsahoval lockfile, proto nešlo reprodukovatelně spustit `npm ci` ani `npm audit`.
2. Offline a timeoutová větev access guardu znovu spouštěla aplikaci bez aktuálního ověření oprávnění. To odporovalo společnému fail-closed pravidlu.
3. Service worker tiše ignoroval chybějící soubory při precache. Takový build mohl vypadat úspěšně, ale být offline neúplný.

## Zachované auditní opravy 1.5.0

Zůstávají ruční JSON round-trip, přesný word-count bez technického markeru, nerecyklované pseudonymní kódy, povinný přepis fotografií/PDF, minimalizace Batch stavu, bezpečné párování, kontrola `finishReason`, ochrana proti prompt injection, limit PDF a explicitní potvrzení trvalého API klíče.

## Nová regresní ochrana

GHRAB QA 1.0.2 nyní umí načíst projektový bezpečnostní validátor. Hodnotitel jej používá pro devět auditních invariantů. Společná PWA brána navíc blokuje tiché polykání chyby precache a technická brána kontroluje runtime regex lookbehind.
