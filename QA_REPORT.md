# QA report — Hodnotitel maturitních slohů 1.5.1

**Datum kontroly:** 17. 7. 2026  
**QA standard:** GHRAB-QA-1.0.2  
**Lokální verdikt:** `AUTOMATED_READY` — deployed smoke test zatím nebyl proveden.

## Co verze 1.5.1 představuje

Verze 1.5.1 zachovává všechny auditní opravy 1.5.0 a doplňuje zpět ekosystémové bezpečnostní a release pojistky: reprodukovatelný lockfile, fail-closed centrální guard, atomickou PWA precache a jednotnou GHRAB QA bránu.

## Interní release brána

- **423/423 kontrol prošlo.**
- **0 chyb.**
- 19 JavaScriptových modulů a 6 CSS modulů.
- Osmipoložková rubrika a její pravidla nebyly měněny.
- Build: verze 1.5.1, rubrika `2026.04.27-r1`.
- `npm ci` a `npm audit --audit-level=high` jsou díky lockfilu reprodukovatelné.

## Společné GHRAB QA brány

- projektové testy a build: PASS;
- technická kontrola: PASS;
- bezpečnostní kontrola včetně devíti auditních invariantů: PASS;
- PWA kontrola: PASS;
- kombinatorika: 10 scénářů ze 108 teoretických kombinací, 100% pairwise pokrytí;
- Chromium galerie: 11 povinných stavů;
- kritická workflow: 6;
- ruční vizuální kontrola: dokončena bez známé vady BLOCKER nebo MAJOR;
- deployed smoke test: neproveden.

## Ověřené auditní regrese

- ruční prompt obsahuje úplné response schema;
- ruční JSON import spouští autoritativní finalizaci a deterministickou známku;
- AI návrh FAIL kódu není sám autoritativní;
- technický marker staré relace nemění počet slov ani obsah;
- pseudonymní kódy se nerecyklují;
- fotografie/PDF bez potvrzeného textu nelze hodnotit;
- snapshot ani hlavní stav neukládají binární přílohy nebo surovou Batch odpověď;
- Batch výsledek bez `metadata.key` se nepřiřazuje podle indexu;
- nejednoznační jmenovci se automaticky nespárují;
- `MAX_TOKENS`, oříznutý nebo neplatný JSON mají řízenou chybu;
- PDF limit platí ve všech importních cestách;
- trvalé uložení API klíče vyžaduje výslovné potvrzení;
- runtime neobsahuje regex lookbehind;
- centrální guard nemá nouzový fail-open režim;
- chybějící povinný precache soubor není tiše ignorován;
- service worker ukládá skutečnou navigační URL.

## Známé provozní hranice

Automatická sada nemůže sama potvrdit skutečné živé volání Gemini, Batch API, Apps Script, doručení e-mailu ani vzdálený permit na produkční adrese. Tyto oblasti jsou součástí deployed smoke testu.

Veřejná databázová zadání a klientské používání API klíče zůstávají dokumentovanými provozními rozhodnutími. Nejde o nově skryté vady verze 1.5.1; případný přesun zadání do privátního importu a API volání na školní backend je samostatná budoucí architektonická změna.
