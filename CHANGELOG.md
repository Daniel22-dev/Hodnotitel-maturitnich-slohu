# Changelog

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
- odstraněny překryté staré implementace reportu, DOCX a PDF;
- bez povolení citlivého ukládání se trvale neuchovává podpis ani vlastní komentáře;
- aktualizována verze backendového klienta a registračního manifestu AI Studia;
- rozšířena release brána o dynamické testy DOCX parseru a struktury vytvořeného Word souboru.

## 1.2.0 – Profesionální reporty a regresní opravy

- nový školní report s logem, hlavičkou, výsledkovým panelem, metadaty a stavem lidské kontroly;
- přepracovaný studentský výstup;
- opraven přenos odečteného počtu slov;
- opraveno pokračování a reset dávky;
- izolována učitelská korekce jednoho slohu od ostatních výsledků;
- opravena synchronizace kontaktů, validace e-mailu, seznam Gemini modelů a lokální datum;
- odstraněny původní legacy funkce a doplněna přístupnost.

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
