# Hodnotitel maturitních slohů 1.5.1

Modulární webová aplikace pro anonymizaci, individuální i dávkové hodnocení, učitelskou kontrolu, profesionální reporty a bezpečné rozeslání zpětné vazby k maturitním slohům z anglického jazyka. Aplikace je součástí ekosystému **AI Studio GHRAB**.

## Co přináší verze 1.5.1

- plně funkční ruční AI režim: prompt obsahuje JSON schéma a importovaný JSON prochází deterministickým bodováním a validační bránou;
- opravený počet slov bez technické značky nahraného souboru a bezpečnější rozpoznání skutečného nadpisu;
- nerecyklovatelné kódy prací a konzervativní párování studentů při shodných příjmeních;
- povinný digitální přepis a učitelská kontrola fotek/PDF i u jednoho slohu;
- Batch odpovědi s citacemi se nikdy neukládají do trvalého stavu a odpověď bez kódu se nepřiřadí podle pořadí;
- srozumitelná chyba při nedokončeném JSONu, limit PDF 15 MB a bezpečnější potvrzení trvalého API klíče;
- kompatibilnější regulární výrazy, opravená cache navigací, adaptivní DOCX tabulky a nové funkční regresní testy.

## Hlavní funkce

- jeden sloh i série do 20 prací;
- import studentů z IS, ZIP import a seskupování vícestránkových prací;
- lokální čtení TXT, CSV, Markdown a DOCX; podpora PDF a obrazových příloh;
- kontrola a potvrzení digitálního přepisu obrazových/PDF prací;
- verzovaná rubrika `2026.04.27-r1`;
- oddělení jazykové analýzy AI od deterministického výpočtu bodů, FAIL pravidel a známky;
- validační brána s kontrolou důkazů a jedním opravným pokusem;
- offline příprava, ruční AI režim, okamžitá fronta a Gemini Batch API;
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

Citlivé ukládání je výchozí vypnuté. Bez vědomého opt-in se neuchová studentský text, výsledek, roster, podpis ani vlastní komentářová banka. Ani při zapnuté obnově se neukládá kompletní surová odpověď Batch API. Pseudonymní historie se ukládá jen po zapnutí této volby a nikdy neobsahuje text práce, jméno ani e-mail.

API klíč nepatří do zdrojového kódu. Trvalé uložení vyžaduje samostatné potvrzení a je určeno pouze pro osobní zařízení. V budoucím oficiálním provozu má klíč držet školní backend.

## Ostrá zadání

Repozitář aktuálně obsahuje i vestavěnou sadu označenou jako ostrá maturitní verze. Je proto nutné počítat s tím, že obsah veřejného repozitáře a výsledného `app.js` není tajný. Přesun této sady do neveřejného lokálního importu je samostatné provozní rozhodnutí autora a verze 1.5.1 jej bez výslovného souhlasu nemění.

## Autorství

Autor a vývojový garant: **Daniel Baláž**  
Školní projekt Gymnázia, Ostrava-Hrabůvka.


## Jednotná certifikace 1.5.1

Úplný lokální průchod se spouští příkazy `npm ci` a `npm run qa:release`. Auditní regrese 1.5.0 jsou zachovány a navíc jsou zapojené do GHRAB QA 1.0.2. Automatické PASS bez ruční galerie a deployed smoke testu neznamená stav READY.
