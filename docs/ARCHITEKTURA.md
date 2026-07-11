# Architektura aplikace

## Základní princip

Hodnotitel 1.3.0 odděluje čtyři odpovědnosti:

1. **AI analytická vrstva** rozpoznává splnění bodů zadání, jazykové chyby, úroveň, PTN, koherenci a důkazy z textu.
2. **Deterministické hodnoticí jádro** vypočítá body, povolené FAIL stavy, výjimku mezi typy essay, PTN penalizaci, pravidlo nuly, součet a známku.
3. **Učitelská vrstva** kontroluje přepis, validaci, ruční korekci a schválení k distribuci.
4. **Reportovací vrstva** vytváří školní/studentkou podobu výsledku, pedagogické doplňky, analytiku a exporty.

AI není jediným zdrojem pravdy pro matematiku a pravidla, která lze vynutit programově. Validační brána porovnává citace a vstupní zámek se skutečným studentským textem.

## Moduly

- `00-release-rubric.js` – verze, modelové konstanty a školní instrukce;
- `05-rubric-spec.js` – strojové schéma výstupu a bodovací konstanty;
- `10-task-database.js` – databáze zadání;
- `15-series-domain.js` – série, limit 20, stav výsledků a spotřeba;
- `20-state-ui.js` – základní stav, modály, navigace a kompatibilní jádro;
- `25-roster-import.js` – import skupiny, ZIP a párování;
- `30-privacy-input.js` – anonymizace, soubory, lokální DOCX parser a privacy kontrola;
- `35-transcription.js` – přepis obrazu/PDF a potvrzení učitelem;
- `40-prompt-model.js` – promptové a modelové funkce;
- `45-evaluation-contract.js` – normalizace, výpočty a validační brána;
- `50-wordcount-offline.js` – lokální word-count audit;
- `60-evaluation-gemini.js` – Gemini funkce a retry;
- `65-evaluation-workflow.js` – okamžitá fronta, strukturované volání a Batch API;
- `70-results-exports-init.js` – základní výstupy, exportní orchestrace, XLSX/ZIP a UI vazby;
- `72-report-enhancements.js` – Report Studio, analytika, historie a profesionální DOCX/PDF;
- `75-distribution.js` – schválení a distribuce;
- `85-backend-adapter.js` – připravený serverový adaptér;
- `95-workflow-ui.js` – workflow, persistence a dashboard série;
- `99-bootstrap.js` – jediný start aplikace.

## Datový tok jedné práce

`vstup → lokální identita → pseudonymizace → přepis a potvrzení → strukturovaná AI analýza → deterministický přepočet → validace → učitelská kontrola → Report Studio → schválení → distribuce`

## Reportovací tok

`strukturované hodnocení + učitelská korekce → efektivní finální data → mapa kategorií / priority / chyby / miniúkol → HTML náhled → TXT / DOCX / PDF / e-mail`

Dávkové reporty vždy používají explicitní kontext konkrétního výsledku. Individuální `teacherReview` se nesmí aplikovat na ostatní studenty.

## Lokální DOCX

- `src/vendor/jszip.min.js` je verzovaná lokální závislost;
- import DOCX otevře ZIP, načte `word/document.xml` a převede odstavce a textové tokeny na prostý text;
- export DOCX vytváří OOXML balík s `document.xml`, `styles.xml`, relationships, properties a vloženým logem;
- externí CDN není pro DOCX/ZIP/XLSX workflow potřeba.

## Persistence

- necitlivé nastavení lze uložit lokálně;
- bez opt-in se citlivá pole, podpis a vlastní komentáře ze stavu před uložením odstraní;
- průběh dávky je primárně v `sessionStorage`;
- pseudonymní historie má samostatný klíč, limit 500 záznamů a je dostupná pouze při zapnutém citlivém ukládání.

## Build

Build seřadí moduly podle názvu, spojí CSS a JavaScript do `dist/index.html` a `dist/app.js`, zkopíruje PWA soubory, lokální vendor knihovnu, rubriku a assety, vygeneruje `studio-manifest.json` a zkontroluje výsledný JavaScript.
