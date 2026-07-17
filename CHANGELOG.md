# Changelog

## 1.5.1 – Zařazení auditních oprav do jednotné certifikační brány

- zachovány všechny funkční a bezpečnostní opravy auditu 1.5.0 a jejich dynamické regrese;
- centrální přístupová brána je znovu striktně fail-closed při chybě, timeoutu i nedostupnosti;
- doplněn reprodukovatelný lockfile a jednotný příkaz `npm run qa:release`;
- PWA precache je atomický: chybějící povinný soubor už nelze tiše přeskočit;
- zachována oprava cacheování skutečné navigační URL pro kořen i interaktivní manuál;
- doplněn bezpečnostní profil auditu, kritická workflow, pairwise matice a Chromium galerie podle GHRAB QA 1.0.2.

## 1.5.0 – Oprava kritických cest po hloubkovém auditu

- ruční AI prompt nyní obsahuje úplné JSON schéma a importovaný JSON se převádí přes `finalizeEvaluation` do autoritativního výsledku;
- technický marker nahraného textu se nepřidává a staré markery se ignorují při počtu slov i vstupním zámku;
- kódy `STUDENT_XXX` se přidělují podle maxima v pracích i výsledcích a po odebrání se nerecyklují;
- jeden sloh z fotky/PDF vyžaduje nejdřív digitální přepis a učitelskou kontrolu;
- kompletní Batch odpověď se neukládá do stavu; Batch výsledek bez `metadata.key` se nepřiřazuje podle indexu;
- zpřesněna heuristika nadpisu, párování jmenovců a normalizace vstupního zámku;
- transkripce už nepoužívá staré pokračování hodnoticího výstupu a strukturovaná cesta hlásí `MAX_TOKENS` srozumitelně;
- odstraněny regex lookbehind, doplněn limit PDF 15 MB, ochrana trvalého klíče, oprava service workeru a adaptivní DOCX tabulky;
- opraveny překlepy v zadáních a doplněny funkční regresní testy.

## 1.4.0 – Anonymní technická telemetrie

- počítání zpracovaných slohů, úspěchů, chyb a zrušení bez textu práce a bez osobních údajů;
- Batch API zapisuje metriku až při dokončení a brání dvojímu započtení;
- interaktivní manuál je z telemetrie vyloučen.

## 1.3.7 – Interaktivní manuál

- samostatný interaktivní manuál v nové kartě;
- stejné oprávnění `essay-evaluator` jako aplikace;
- zařazení manuálu do PWA a manifestu AI Studia.

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
