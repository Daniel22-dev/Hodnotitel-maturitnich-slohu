# Changelog

## 1.3.3 – Tvrdá oprava školního loga a instalační ikony

- školní logo v aplikaci je nyní skutečně transparentní bílý asset bez bílé čtvercové plochy;
- reporty používají samostatnou černou transparentní variantu loga;
- PWA používá nový manifest `manifest-v1.3.3.webmanifest`, nové názvy ikon a samostatnou maskable ikonu;
- registrace service workeru vynucuje aktualizaci bez HTTP cache;
- import jednořádkového seznamu z IS zůstává ověřen: 16 e-mailů = 16 studentů.

## Integrace AI Studio GHRAB 0.6.2 — 2026-07-11

- sjednocen repository dispatch na událost `app-updated`;
- kompatibilita manifestu zvýšena na AI Studio 0.6.2;
- registrační fallback používá lokální ikonu portálu.

## 1.3.3 – Oprava importu z IS a sjednocení brandingu

- opraven import seznamu studentů z IS, který byl vložen na jednom řádku a oddělen čárkami nebo středníky;
- parser nově podporuje čárky, středníky, tabulátory, svislítka i nové řádky a jejich kombinace;
- odstranění duplicit, odvození čitelného jména z e-mailu a respektování limitu 20 studentů;
- živý náhled počtu rozpoznaných studentů a upozornění na chybně zapsané položky;
- sjednocena barva celého názvu „Hodnotitel maturitních slohů“;
- obnoveno ostré černobílé školní logo bez chybné téměř úplné průhlednosti;
- nová vycentrovaná PWA ikona se štítem, perem a potvrzením;
- ikony jsou připravené pro běžnou i maskable instalaci;
- přidány regresní testy přesně pro čárkový export z IS;
- reálné studentské adresy nebyly vloženy do veřejného repozitáře ani testů.

## 1.3.0 – Kompletní Report Studio, lokální DOCX a finální hardening

- formální školní a přívětivý studentský vzhled reportu;
- A4 náhled, volitelný podpis učitele, bodová mapa osmi kategorií a tři prioritní karty;
- automatické třídění chyb na kritické, opakující se a jednorázové;
- revizní miniúkol sestavený z konkrétních chyb a nejslabší hodnocené oblasti;
- komentářová banka učitele s vlastními větami;
- kontrola souladu slovního komentáře, bodů, součtu a známky;
- anonymní třídní analytika pouze ze schválených validních výsledků;
- opt-in pseudonymní historie pouze pro finálně zkontrolované práce;
- skutečně formátovaný DOCX se školním logem, styly, tabulkami a podpisem;
- DOCX import, ZIP, DOCX a XLSX exporty fungují z lokální knihovny bez CDN;
- odstraněny překryté staré implementace reportu, DOCX a PDF.

## 1.2.0 – Profesionální reporty a regresní opravy

- nový školní report s logem, hlavičkou, výsledkovým panelem, metadaty a stavem lidské kontroly;
- přepracovaný studentský výstup;
- opraven přenos odečteného počtu slov;
- opraveno pokračování a reset dávky;
- izolována učitelská korekce jednoho slohu od ostatních výsledků;
- opravena synchronizace kontaktů, validace e-mailu, seznam Gemini modelů a lokální datum.

## 1.1.0 – Třídní workflow a validační jádro

- kompletní pracovní tok pro série do 20 prací;
- import skupiny, ZIP a vícestránkové práce;
- verzovaná rubrika a strukturovaný JSON výstup;
- deterministický výpočet bodů, FAIL pravidel a známky;
- validační brána, okamžitá fronta, Gemini Batch API a Gmail workflow.

## 1.0.0 – AI Studio Edition

- originální profesionální prostředí;
- modularizovaný zdrojový kód;
- PWA, GitHub Actions a AI Studio manifest;
- anonymizace, dávkové hodnocení, exporty a učitelská revize.
