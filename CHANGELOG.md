# Changelog

## 1.3.6 – Stabilizace obalu aplikace po hloubkovém auditu

- PWA používá stabilní `id`, `start_url` a jediný soubor `manifest.webmanifest`;
- service worker vrací `index.html` pouze při navigaci, nikoli při chybě skriptu, obrázku nebo JSON souboru;
- přístupová brána má lokální CSS, timeout a označený nouzový offline režim; explicitní zamítnutí oprávnění se neobchází;
- duplicitní varianty loga byly odstraněny a nahrazeny jediným kanonickým souborem `assets/ghrab-logo.png`;
- odstraněna protichůdná a mrtvá CSS pravidla pro logo;
- snapshot dávky neobsahuje base64 přílohy, ukládá se s debounce a při selhání zobrazí varování;
- analytický prompt byl zkrácen a zbaven chatových artefaktů, výpočetních instrukcí a pokynů k ruční anotaci dokumentu;
- jediným zdrojem verze je `package.json`;
- anonymizace nahrazuje celé zadané jméno i jeho samostatné části, ale skloňované tvary a přezdívky musí uživatel nadále doplnit;
- prosté devítimístné a desetimístné sekvence se označí k ruční kontrole místo automatického smazání;
- doplněny funkční zlaté testy; celkem 385 kontrol bez chyby;
- opravena heuristika nadpisu v lokálním word-countu.

## 1.3.5 – Sjednocení identity AI Studio GHRAB

- sjednoceno školní logo, název školy a autorské údaje v zápatí;
- tato změna odhalila, že dřívější soubory pojmenované jako bílé a černé varianty byly po sjednocení binárně totožné; opraveno ve verzi 1.3.6.

## 1.3.4 – Obnova nasazení a import seznamu z IS

- volitelné oznámení AI Studiu již nemohlo shodit celý release test;
- opraven import jednořádkového seznamu e-mailů oddělených čárkami nebo středníky;
- přidán živý náhled, deduplikace a limit 20 studentů;
- PWA tehdy používala verzované manifesty jako nouzové řešení cache; tento model byl ve verzi 1.3.6 nahrazen stabilní identitou.

## 1.3.0 – Kompletní Report Studio, lokální DOCX a hardening

- formální školní a přívětivý studentský vzhled reportu;
- A4 náhled, volitelný podpis, bodová mapa osmi kategorií a prioritní karty;
- komentářová banka, třídní analytika a pseudonymní historie;
- formátovaný DOCX se školním logem, styly, tabulkami a podpisem;
- lokální JSZip bez CDN a lokální čtení DOCX;
- odstraněny překryté staré implementace reportu, DOCX a PDF.

## 1.2.0 – Profesionální reporty a regresní opravy

- nový školní a studentský report;
- opraven přenos odečteného počtu slov a pokračování dávky;
- izolována učitelská korekce jednoho slohu;
- opravena synchronizace kontaktů, validace e-mailu a lokální datum.

## 1.1.0 – Třídní workflow a validační jádro

- série do 20 prací, import skupiny, ZIP a vícestránkové práce;
- verzovaná rubrika a strukturovaný JSON výstup;
- deterministické body, FAIL pravidla a známka;
- validační brána, fronta, Gemini Batch API a Gmail workflow.

## 1.0.0 – AI Studio Edition

- modularizovaný zdrojový kód, PWA, GitHub Actions a AI Studio manifest;
- anonymizace, dávkové hodnocení, exporty a učitelská revize.
