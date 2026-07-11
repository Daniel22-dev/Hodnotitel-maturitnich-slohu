# QA report — Hodnotitel maturitních slohů 1.3.0

**Datum kontroly:** 11. 7. 2026  
**Stav:** připraveno k rozšířenému řízenému školnímu pilotu; živé externí integrace je nutné před oficiálním provozem ověřit na testovací sérii

## Automatická release brána

- **341/341 kontrol prošlo.**
- Zdroj obsahuje **19 JavaScriptových modulů** a **5 CSS modulů**.
- Ověřena shoda verze balíčku, aplikace, service workeru, backendového klienta a registračních dat AI Studia.
- Ověřena syntaxe všech zdrojových modulů i výsledného `dist/app.js`.
- Ověřen build, PWA soubory, školní logo, lokální JSZip a rubrika `2026.04.27-r1`.
- Ověřeno, že balík neobsahuje Gemini API klíč, Apps Script URL ani sdílené tajemství.
- Changelog v aplikaci obsahuje přesně deset nejnovějších verzí.

## Nové funkční a regresní kontroly

Testy výslovně hlídají:

- jedinou aktivní implementaci generátoru reportu, DOCX a PDF;
- školní hlavičku, logo a strukturovaná metadata reportu;
- A4 režim, oba vizuální styly, bodovou mapu, prioritní karty a revizní miniúkol;
- komentářovou banku, třídění chyb a kontrolu souladu komentáře s body;
- anonymní analytiku pouze ze schválených validních výsledků;
- historii jednotlivce pouze po finální učitelské kontrole;
- neukládání podpisu a vlastních komentářů bez opt-in citlivého ukládání;
- lokální JSZip bez CDN a odstranění závislosti na Mammoth;
- lokální převod WordprocessingML na text včetně entit, odstavců, tabulátorů a zalomení;
- dynamické vytvoření DOCX a přítomnost základních částí balíku, Word stylů, loga, vztahů a podpisu;
- service worker cache lokální knihovny.

Release brána nadále spouští funkční kontroly importu skupiny, vícestránkových prací, bodových pásem, FAIL-1 až FAIL-4, pravidla nuly, PTN penalizace, minimálního rozsahu, validační brány, citací proti zdrojovému textu, Gemini JSON kontraktu, Batch API, tokenů, schvalování a Gmail distribuce.

## Build

- `npm test`: **341 PASS / 0 FAIL**.
- `npm run build`: dokončeno bez chyby.
- Výsledný JavaScript prošel `node --check`.
- Nasaditelná složka `dist/` byla vytvořena ze zdrojů verze 1.3.0.
- Lokální JSZip a jeho MIT licence jsou součástí balíku.

## Co nebylo možné v tomto prostředí živě ověřit

- skutečné hodnocení přes Gemini API bez soukromého API klíče;
- skutečnou Gemini Batch úlohu;
- nasazený Apps Script, Gmail koncepty a reálné odeslání;
- budoucí školní backend;
- odemčení přes centrální AI Studio policy;
- plný screenshotový/E2E test v Chromiu: systémový Chromium v kontejneru se nespustil korektně ani na prázdné stránce kvůli omezením procesu/DBus. Nejde tedy o zjištěnou chybu aplikace. Vizuální struktura byla ověřena HTML/CSS kontrolami a buildem; DOCX byl navíc dynamicky vytvořen a rozbalen v testu.

## Povinný pilot před oficiálním použitím

1. Porovnat nejméně 10 anonymizovaných referenčních slohů s ručním hodnocením zkušeného učitele.
2. Otestovat celou sérii pouze na testovacích nebo vlastních e-mailech.
3. Nejdřív používat Gmail koncepty, nikoli přímé odeslání.
4. Ručně ověřit report na desktopu, mobilu a při tisku do PDF.
5. Otevřít několik vytvořených DOCX ve Wordu i LibreOffice a zkontrolovat stránkování.
6. Prověřit správné párování student → práce → e-mail.
7. Ověřit reálné limity, model a účtování školního Gemini projektu.

Jazykový úsudek AI nelze garantovat jako stoprocentně neomylný. Formalizovatelná pravidla a matematiku aplikace vynucuje programově; finální odpovědnost zůstává učiteli.
