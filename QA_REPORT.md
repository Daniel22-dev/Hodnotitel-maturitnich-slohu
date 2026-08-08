# QA report — Hodnotitel maturitních slohů 1.5.10

> Hotfix P5 R2: doplněn přístupný název tlačítka reportéru, opraven kontrast platformní patičky a přidána regresní kontrola. Hodnoticí rubrika, práce studentů ani datové formáty nebyly změněny.

## Etapa P2 · verze 1.5.6

GHRAB Platform 1.0.0, kanonický branding, namespacované úložiště, jednotný service worker a reportér GHRAB 1.1.0 byly ověřeny společnou konformitní sadou.
# QA report — Hodnotitel maturitních slohů 1.5.4

> Etapa P0 1.5.4: reportér mimo kritickou cestu, scope-safe service worker a server-ready deployment kontrakt. Finální výsledky QA jsou uvedeny v centrálním protokolu etapy.

**Datum kontroly:** 2026-08-04
**QA standard:** GHRAB-QA-1.0.2
**Lokální verdikt:** `AUTOMATED_READY` — deployed smoke test zatím nebyl proveden.

## Co verze 1.5.4 představuje

Verze 1.5.4 zachovává auditní opravy a přidává jednotný lokální technický reportér AI Studia bez zásahu do hodnoticí rubriky nebo dat studentů.

## Interní release brána

- Přesný výsledek aktuální automatické sady je uveden v release reportu vytvořeném při sestavení.
- Historické počty z verze 1.5.2 nejsou vydávány za výsledek této verze.
- 19 JavaScriptových modulů a 6 CSS modulů.
- Osmipoložková rubrika a její pravidla nebyly měněny.
- Build: verze 1.5.4, rubrika `2026.04.27-r1`.
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

Veřejná databázová zadání a klientské používání API klíče zůstávají dokumentovanými provozními rozhodnutími. Nejde o nově skryté vady verze 1.5.4; případný přesun zadání do privátního importu a API volání na školní backend je samostatná budoucí architektonická změna.

## Dodatek P1 – verze 1.5.5

P1 zachovává kanonický reportér 1.1.0 a doplňuje serverovou AI vrstvu. Výsledky finální projektové sady jsou evidovány samostatně; tento dodatek pouze svazuje QA dokument s verzí 1.5.5.
