# Komentář změn — Hodnotitel maturitních slohů 1.5.0

## Proč vznikla verze 1.5.0

Verze reaguje na hloubkový audit stavu 1.4.0. Nálezy nebyly převzaty automaticky: každý důležitý bod byl znovu ověřen proti zdrojovému kódu a funkčním chováním aplikace. Všech pět kritických nálezů se potvrdilo. Jádro aplikace — oddělení AI analýzy od deterministického výpočtu bodů, FAIL podmínek a známky — zůstalo zachováno.

## Kritické opravy

### 1. Ruční AI režim je skutečně použitelný

Dříve se do externí AI kopíroval prompt odkazující na nepřiložené response schema a vložený výsledek se zobrazil pouze jako surový text. Nyní:

- ruční prompt obsahuje úplné JSON schéma;
- AI dostane pokyn vrátit pouze JSON bez code fence;
- import odstraní případný obal ```json, provede `JSON.parse`, spustí `finalizeEvaluation` a převede výsledek přes `evaluationToLegacyResult`;
- lokální engine dopočítá body, FAIL podmínky, známku a validační stav stejně jako v API režimu;
- starší výstup s interními markery lze stále načíst jako legacy formát;
- hromadný prompt obsahuje schéma u každé práce a jasně upozorňuje, že zpětný import je zatím určen jen pro jeden sloh.

### 2. Počet slov už neovlivní technický marker souboru

Nahraný TXT/DOCX se připojuje bez řádku `[ZDROJ: NAHRANÝ_TEXT]`. Obranně se tento marker ignoruje i při načtení starší uložené relace. Nemůže proto:

- přidat dvě falešná slova;
- posunout práci přes hranici 195 slov;
- vydávat se za nadpis;
- porušit kontrolu první věty.

### 3. Kódy studentů se nerecyklují

Nový kód se určuje jako maximum ze všech kódů v pracích i výsledcích plus jedna. Po odebrání práce se tedy existující `STUDENT_003` nepřepíše nově přidanou prací se stejným kódem. Při přidání funguje ještě druhá kontrola unikátnosti.

### 4. Fotka/PDF jednoho slohu vyžaduje přepis

Přílohu bez digitálního textu už nelze přímo hodnotit. Aplikace nabídne tlačítko **Přepsat přes Gemini**, vloží přepis do textového pole a vyžaduje učitelskou kontrolu před spuštěním hodnocení. Tím se odstranila cesta, která z prázdného lokálního textu počítala nula slov a automaticky dávala známku 5.

### 5. Surová Batch odpověď se neukládá

Kompletní `inlinedResponses` s citacemi ze studentských prací se už nedrží v `state`. Při ukládání hlavního stavu i snapshotu se Batch úloha převádí přes whitelist neobsahující odpovědi modelu. Zachovává se pouze identifikátor úlohy, stav, kódy, model a časové/telemetrické údaje.

## Další potvrzené opravy

- Heuristika nadpisu už nepovažuje libovolnou první krátkou větu review/narration automaticky za nadpis.
- Přepis přes Gemini nepoužívá starou pokračovací logiku určenou pro hodnoticí Markdown; při `MAX_TOKENS` vrátí srozumitelnou chybu.
- Strukturované hodnocení kontroluje `finishReason` a při oříznutém JSONu nezobrazuje kryptické `Unexpected end of JSON input`.
- Dva jmenovci se stejným slabým skóre se nepárují automaticky; zůstávají k ručnímu výběru.
- Batch odpověď bez `metadata.key` se nikdy nepřiřadí studentovi podle pořadí.
- Anonymizace jména funguje i mezi variantou s diakritikou a bez diakritiky.
- Prompt výslovně označuje studentský text za data a ignoruje případné instrukce vložené studentem.
- Vstupní zámek porovnává normalizovanou první a poslední větu.
- Odstraněn nepoužitý raw pohled a pozůstatek `appMode`.
- Odstraněny regex lookbehind, které mohly shodit aplikaci už při načítání ve starších prohlížečích.
- PDF má limit 15 MB v single režimu, dávce i ZIP importu.
- Trvalé uložení API klíče nelze aktivovat bez explicitního potvrzení.
- Service worker ukládá skutečnou navigační URL, takže návštěva manuálu nepřepíše offline kořen aplikace.
- Importovaná zadání se typově normalizují.
- Šířka sloupců DOCX tabulky se přizpůsobuje jejich počtu; u široké evidence se sníží velikost písma.
- Opraveny překlepy v zadáních, timer přístupové brány, zobrazení USD a nadbytečné synchronizace formuláře.

## Co jsem záměrně nezměnil

### Veřejná ostrá zadání

Audit správně upozornil, že zadání vložená přímo do veřejného repozitáře lze přečíst ve zdroji i ve výsledném `app.js`. Nejde o programátorskou chybu, ale o rozhodnutí o provozu a integritě zadání. Zadání jsem bez výslovného souhlasu neodstranil. Riziko je nyní otevřeně uvedeno v README. Doporučeným budoucím řešením je neveřejný lokální JSON import.

### Vědomé kompromisy

Nezměnil jsem klientskou přístupovou bránu, pilotní práci s API klíčem v prohlížeči, Apps Script protokol, pravidlo jednoho zadání pro jednu sérii ani samotnou rubriku. Tyto body audit označil jako vědomá rozhodnutí autora.

### Nízkoprioritní zjednodušení

DOCX buňky nadále převádějí obsah na prostý text bez plného inline Markdown formátování. Nemá to vliv na body, známku, bezpečnost ani přiřazení studenta.

## Regresní ochrana

Testovací sada vzrostla z 388 na **415 kontrol**. Nově skutečně spouští mimo jiné:

- ruční JSON round-trip až po deterministický výsledek;
- word-count se starým technickým markerem;
- review s nadpisem i bez nadpisu;
- remove → add kódů studentů;
- nejednoznačné párování jmenovců;
- ukládání hlavního stavu i snapshotu bez surové Batch odpovědi;
- blokaci single přílohy bez přepisu;
- kontrolu verzí README/CHANGELOG;
- absenci regex lookbehind a mrtvé ruční instrukce.

Výsledek release brány: **415 PASS / 0 FAIL**, build verze **1.5.0**, 19 JS modulů, 6 CSS modulů, rubrika `2026.04.27-r1`.
