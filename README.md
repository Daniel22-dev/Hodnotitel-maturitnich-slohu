# Hodnotitel maturitních slohů 1.3.2

Modulární webová aplikace pro anonymizaci, individuální i dávkové hodnocení, učitelskou kontrolu, profesionální reporty a bezpečné rozeslání zpětné vazby k maturitním slohům z anglického jazyka. Aplikace je připravena jako součást ekosystému **AI Studio GHRAB**.

## Co přináší verze 1.3.2

- opravený import seznamu z IS i pro jeden dlouhý řádek e-mailů oddělených čárkou nebo středníkem;
- živé počitadlo rozpoznaných studentů, validace položek a odstranění duplicit;
- sjednocená barva hlavního názvu;
- obnovené kontrastní černobílé logo školy;
- nová vycentrovaná PWA ikona se štítem, perem a potvrzením;
- regresní testy používají výhradně syntetické adresy.

- **Report Studio** se dvěma vzhledy: formální školní a přívětivý studentský;
- přesný **A4 náhled**, tisk/PDF a volitelný podpis či iniciály učitele;
- bodová mapa všech osmi kategorií a tři prioritní karty „Udržet / Zlepšit / Příště zkontrolovat“;
- třídění jazykových nálezů na kritické, opakující se a jednorázové;
- automatický revizní miniúkol odvozený z konkrétních chyb a nejslabší oblasti;
- komentářová banka učitele včetně vlastních opakovaně použitelných vět;
- kontrola souladu bodů, známky a slovního komentáře;
- anonymní třídní analytika pouze ze schválených validních výsledků;
- volitelná pseudonymní historie pokroku bez textu práce, jména a e-mailu;
- skutečně formátovaný DOCX se školním logem, styly, tabulkami a podpisem;
- plně lokální ZIP/DOCX/XLSX workflow bez CDN; běžné DOCX lze načíst i bez internetu;
- odstranění překrytých starých generátorů reportu, DOCX a PDF;
- dodatečné privacy pojistky pro podpis, vlastní komentáře, analytiku a historii.

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
