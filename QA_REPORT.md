# QA report — Hodnotitel maturitních slohů 1.3.2

**Datum kontroly:** 11. 7. 2026  
**Stav:** připraveno k aktualizaci repozitáře a pokračování řízeného školního pilotu

## Automatická release brána

- **348/348 kontrol prošlo.**
- **0 chyb.**
- Zdroj obsahuje **19 JavaScriptových modulů** a **5 CSS modulů**.
- Ověřena shoda verze balíčku, aplikace, service workeru, backendového klienta a registračních dat AI Studia.
- Ověřena syntaxe všech zdrojových modulů i výsledného `dist/app.js`.
- Ověřen produkční build, PWA manifest, service worker, lokální JSZip, školní logo a rubrika `2026.04.27-r1`.
- Changelog v aplikaci obsahuje přesně deset nejnovějších verzí.

## Nové regresní kontroly 1.3.2

Testy výslovně ověřují:

- čárkový export z IS na jednom řádku se rozdělí na 16 samostatných studentů;
- zachování prvního i posledního e-mailu v seznamu;
- automatické odvození jména z e-mailové adresy;
- kombinaci čárek, středníků a nových řádků;
- odstranění duplicit;
- limit maximálně 20 studentů;
- existenci živého náhledu importu;
- jednotnou barvu titulku;
- přítomnost zdrojového SVG nové ikony;
- maskable nastavení PWA ikon.

Testovací data jsou syntetická. Reálné adresy studentů poskytnuté při ladění nebyly zapsány do zdrojového kódu, testů ani dokumentace.

## Build

- `npm test`: **348 PASS / 0 FAIL**.
- `npm run build`: dokončeno bez chyby.
- Nasaditelná složka `dist/` byla vytvořena ze zdrojů verze 1.3.2.
- Výsledný JavaScript prošel syntaktickou kontrolou.
- Nové logo a obě velikosti ikony jsou součástí `dist/`.

## Co je vhodné ověřit po nasazení

1. Na mobilu obnovit stránku nebo přeinstalovat PWA, aby se načetla nová ikona místo staré z cache.
2. Vložit testovací čárkový seznam a zkontrolovat živé počitadlo před kliknutím na „Načíst skupinu“.
3. Ověřit školní logo na tmavém headeru i ve výsledném reportu.
4. Otestovat jednu anonymizovanou testovací sérii před prací s reálnou třídou.

Živé volání Gemini, Apps Script a centrální odemykání AI Studia zůstávají závislé na externím nasazení a přístupových údajích.
