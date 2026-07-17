# QA report — Hodnotitel maturitních slohů 1.5.0

**Datum kontroly:** 17. 7. 2026
**Stav:** release brána zelená; připraveno k aktualizaci repozitáře a následnému integračnímu smoke testu

## Automatická release brána

- **415/415 kontrol prošlo.**
- **0 chyb.**
- Zdroj obsahuje **19 JavaScriptových modulů** a **6 CSS modulů**.
- `npm run check` úspěšně provedl testy i reprodukovatelný build.
- Výstup buildu: `[build] HOTOVO · verze 1.5.0 · 19 JS modulů · 6 CSS modulů · rubrika 2026.04.27-r1`.

## Nově ověřené regresní scénáře

- ruční prompt obsahuje skutečné response schema;
- ruční JSON import spouští `finalizeEvaluation`, vytvoří interní markery a autoritativní známku;
- technický marker staré relace nemění počet slov ani první větu;
- review bez nadpisu nepřijde o první větu, skutečný nadpis se rozpozná;
- po odebrání práce se kód `STUDENT_XXX` nerecykluje;
- dva jmenovci se stejným slabým skóre se automaticky nespárují;
- single fotka/PDF bez textu je před hodnocením blokována;
- hlavní stav ani snapshot neobsahují `inlinedResponses`/`candidates`;
- Batch výsledek bez `metadata.key` se nepřiřadí podle indexu;
- `MAX_TOKENS` má řízené chybové hlášení;
- PDF limit a potvrzení trvalého API klíče jsou přítomné ve všech relevantních cestách;
- zdroj neobsahuje regex lookbehind ani mrtvou konstantu starého ručního výstupu;
- README a CHANGELOG odpovídají verzi v `package.json`.

## Kontroly zachovaného jádra

- osm kategorií rubriky, převod bodů na známku a čtyři FAIL podmínky;
- výjimka opinion ↔ for-and-against a penalizace PTN;
- validační brána včetně kontroly skutečného výskytu citací;
- lokální word-count a audit po odstavcích;
- anonymizace, roster, ZIP/DOCX import a seskupení vícestránkových prací;
- export DOCX se školním logem, styly, tabulkami a podpisem;
- PWA manifest, service worker, přístupová brána a AI Studio manifest;
- absence vloženého API klíče, Apps Script URL a sdíleného tajemství.

## Výsledek buildu

- verze: **1.5.0**;
- rubrika: **2026.04.27-r1**;
- PWA manifest: `manifest.webmanifest`;
- jediná cache verze service workeru je odvozena z `package.json`;
- nasaditelná složka: `dist/`;
- `dist/` je čistý a obsahuje `.nojekyll`, jediný manifest a aktuální sadu ikon.

## Doporučený ruční smoke test po nasazení

1. Otevřít aplikaci z AI Studia s platným oprávněním.
2. V ručním AI režimu zkopírovat prompt, vložit syntetický JSON a ověřit body, známku a validační hlášení.
3. Nahrát 194slovný TXT a ověřit, že zůstane 194 slov a v poli není technický marker.
4. Nahrát jednu testovací fotografii/PDF, ověřit blokaci hodnocení, spustit přepis a text učitelsky potvrdit.
5. V dávce přidat tři práce, první odebrat, přidat další a ověřit nový kód `STUDENT_004`.
6. Importovat dva studenty se stejným příjmením a ověřit, že nejednoznačná práce zůstane nespárovaná.
7. Spustit syntetickou Batch úlohu a po dokončení zkontrolovat, že obnova relace neobsahuje surovou odpověď.
8. Vygenerovat DOCX evidence a zkontrolovat širokou tabulku, logo a podpis.
9. Ověřit PWA root i manuál online a po prvním načtení také offline.

Živé volání Gemini, Batch API, Apps Script a vzdálený modul přístupové brány vyžadují samostatný integrační test v nasazeném prostředí. Automatická sada nemůže ověřit dostupnost cizích služeb ani skutečné doručení e-mailu.
