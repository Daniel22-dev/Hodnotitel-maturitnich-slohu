# Hodnotitel maturitních slohů 1.3.6

Modulární webová aplikace pro anonymizaci, individuální i dávkové hodnocení, učitelskou kontrolu, profesionální reporty a bezpečné rozeslání zpětné vazby k maturitním slohům z anglického jazyka. Aplikace je připravena jako součást ekosystému **AI Studio GHRAB**.

## Co přináší verze 1.3.6

- jediný kanonický soubor školního loga pro rozhraní, reporty i DOCX;
- stabilní PWA identitu a jediný `manifest.webmanifest`;
- service worker s HTML fallbackem pouze pro navigaci;
- lokální vzhled přístupové brány, časové limity a označený nouzový offline režim;
- bezpečnější obnovu dávky bez base64 příloh, s odloženým ukládáním a hlášením chyby;
- výrazně kratší analytický prompt bez chatových artefaktů a instrukcí k výpočtu známky;
- verzi aplikace řízenou jedině z `package.json`;
- rozšířenou anonymizaci zadaného jména a opatrnější rozpoznávání číselných identifikátorů;
- funkční zlaté testy word-countu, snapshotu a pseudonymizace;
- opravu heuristiky, která mohla jednorádkový text mylně označit jako nadpis.

## Hlavní funkce

- jeden sloh i série do 20 prací;
- import studentů z IS, ZIP import a seskupování vícestránkových prací;
- lokální čtení TXT, CSV, Markdown a DOCX; podpora PDF a obrazových příloh;
- kontrola a potvrzení digitálního přepisu obrazových/PDF prací;
- verzovaná rubrika `2026.04.27-r1`;
- oddělení jazykové analýzy AI od deterministického výpočtu bodů, FAIL pravidel a známky;
- validační brána s kontrolou důkazů a jedním opravným pokusem;
- okamžitá řízená fronta i Gemini Batch API;
- evidence tokenů a orientačních nákladů;
- učitelské schválení před distribucí;
- Gmail koncepty / odeslání přes přiložený Apps Script;
- TXT, profesionální DOCX, CSV, XLSX, tisk/PDF a dávkový ZIP;
- kontrakt pro budoucí školní backend.

## Rychlý start vývoje

Požadavky: Node.js 20 nebo novější.

```bash
npm run check
```

Příkaz spustí automatické testy a vytvoří nasaditelnou složku `dist/`.

## Struktura

- `src/js/` – tematické JavaScriptové moduly;
- `src/styles/` – designové a workflow styly;
- `src/vendor/` – lokální JSZip 3.10.1 a licence;
- `src/rubric/` – strojově čitelná školní rubrika;
- `integrations/gmail-apps-script/` – Gmail bridge;
- `integrations/backend-contract/` – OpenAPI kontrakt budoucího serveru;
- `docs/` – pracovní postup, bezpečnost, architektura a nasazení;
- `tests/` – automatické release a regresní kontroly;
- `dist/` – výsledek buildu určený pro GitHub Pages.

## Bezpečnostní zásady

Aplikace zůstává učitelským nástrojem v řízeném pilotu. Skutečná jména a e-maily slouží pouze k lokálnímu párování a distribuci. Do AI požadavku má odcházet pseudonymní kód a zkontrolovaný text. AI výstup není automaticky konečným hodnocením; před rozesláním jej musí zkontrolovat a schválit učitel.

Citlivé ukládání je výchozí vypnuté. Bez vědomého opt-in se neuchová studentský text, výsledek, roster, podpis ani vlastní komentářová banka. Pseudonymní historie se ukládá jen po zapnutí této volby a nikdy neobsahuje text práce, jméno ani e-mail.

API klíč nepatří do zdrojového kódu. V budoucím oficiálním provozu jej má držet školní backend.

## Autorství

Autor a vývojový garant: **Daniel Baláž**  
Školní projekt Gymnázia, Ostrava-Hrabůvka.
