## 1.5.22 – P5 acceptance gate consistency hotfix (2026-09-05)

- Tři nezávislé GitHub Actions logy kandidáta 1.5.21 potvrdily, že served runtime je čistý (`initFailures: 0`, `qaErrors: 0`, `blockers: 0`) a axe runtime je čistý (`critical: 0`, `serious: 0`, `moderate: 0`, `minor: 0`).
- Jediný společný FAIL byl `acceptance.github-pending`: legacy P5-R2 acceptance skript bezpodmínečně vyžadoval `github.status === "not-yet-uploaded"`, zatímco Platform 1.1.2 ecosystem-wave kandidát pravdivě deklaruje `post-fix-ci-validation-required`.
- `qa-p5-acceptance.mjs` nyní rozlišuje legacy pre-upload stav od `ecosystem-wave-candidate`. Wave kandidát může projít pouze při zachovaném fail-closed stavu: `currentUseApproved: false`, povinná post-upload validace, `sharedDeviceCleanupGreen: false`, `e01Closed: false` a syntetická data do dokončení wave.
- Přidány regresní kontroly release-policy konzistence; gate se nezměkčuje na produkční GREEN a nemění Platformu 1.1.2, suite-session cleanup ani aplikační runtime.
- Kandidát zůstává AMBER do nového GitHub Actions průchodu 1.5.22 a dokončení koordinované ecosystem release wave.

## 1.5.21 – CI runtime bootstrap hotfix po 1.5.20 (2026-09-05)

- GitHub Actions artefakt 1.5.20 potvrdil, že předchozí `initBackendAdapter()` i axe contrast problémy jsou opravené (`critical: 0`, `serious: 0`), ale hlavní stránka stále končila 3/3 init failures kvůli neexistujícímu volání `renderRelease()` v `bootstrapApplication()`.
- Neexistující `renderRelease()` bylo odstraněno; bootstrap nyní volá pouze skutečně definované app-owned startup hooky.
- `npm test` dostal explicitní regresi pro `renderRelease()` a souhrnnou kontrolu všech app-owned bootstrap hooků, aby další podobná chyba byla zachycena ještě před browser CI.
- GHRAB Platform zůstává přesně 1.1.2; suite-session, PC-01 storage ownership ani acknowledgement mechanismus se tímto hotfixem nemění.
- Release metadata zůstávají fail-closed: `ecosystem-wave-candidate`, `currentUseApproved: false`; ostrá data jsou zakázána do dokončení release wave.

## 1.5.20 – CI runtime/a11y oprava po validaci kandidáta 1.5.19 (2026-09-05)

- Opraven GitHub Actions runtime blocker z kandidáta 1.5.19: `bootstrapApplication()` už nevolá neexistující `initBackendAdapter()`. Existující backend wiring zůstává v `initSeriesWorkflow()` / `syncBackendToFields()` bez duplicitní inicializace.
- Opraveno 6 serious axe nálezů se společnou příčinou: appendovaný GHRAB Platform footer nyní v aplikačním `.app-footer` dědí `var(--t2)`; vendor Platform 1.1.2 nebyl měněn ani forkut.
- Přidány statické regresní kontroly pro neexistující backend initializer a pro kontrastní app-level footer override, aby oba regresní typy blokoval už `npm test`.
- Release metadata zůstávají fail-closed: `ecosystem-wave-candidate`, `currentUseApproved: false`, post-fix served-runtime/axe validace na GitHub Actions je povinná před jakýmkoli posunem gate.
- E-01, F-02 a F-03 zůstávají ekosystémové follow-upy; tato oprava je neuzavírá.

## 1.5.19 – GHRAB Platform 1.1.2 suite-session kandidát (2026-09-05)

- Migrace child aplikace z GHRAB Platform 1.1.0 na referenční Platform 1.1.2 a kontrakt `ghrab-suite-session-v1`.
- PC-01 opravil storage manifest podle skutečných writerů, včetně session task databáze a batch recovery.
- Suite end maže pouze app-owned obsah s `clearOnEndWork: true`; lifecycle, migrační metadata, neobsahové cache a nastavení zůstávají zachovány.
- Přidán fail-closed cleanup s observed/cleanup-complete evidencí a ACK až po ověřeném úklidu.
- Přidán multi-tab a Back/Forward guard proti obnovení starých dat přes stale in-memory stav a autosave.
- Přidána browser suite-session QA včetně delayed replay, fail-closed canary a povinného negative control.
- Kandidát je určen pro koordinovanou Platform 1.1.2 ecosystem release wave; samotná migrace této aplikace neuzavírá E-01 na úrovni celého ekosystému.

## 1.5.18 – GARP 2.3 finální oprava po třetím Claude kole (2026-08-30)

- Opraven nález B3-01 / MEDIUM z poslední nezávislé Claude kontroly.
- Repository secret scanner už nečeká pouze legacy objekt `set: "exam"`; parsuje skutečný JSON export/import databáze a blokuje top-level větev `exam`, pokud obsahuje neprázdný `taskText`.
- Zachována detekce staršího `set: "exam"` tvaru i běžných tajných hodnot a citlivých souborů.
- Bezpečnostní regrese používá skutečný tvar `JSON.stringify(tasks, null, 2)` a samostatná negative control potvrzuje blokující FAIL nad syntetickým exportem ostré sady.
- Dokumentace EXAM-TASK-SECURITY byla opravena tak, aby přesně popisovala skutečně vynucenou CI ochranu.
- Žádná změna runtime hodnocení, prompt assembly, AI egressu ani storage modelu proti 1.5.17.

## 1.5.17 – GARP 2.3 třetí kolo (2026-08-30)
- D-08: skutečný obsah ostrých maturitních zadání odstraněn ze zdroje i veřejného buildu; budoucí důvěrná sada se importuje pouze lokálně.
- Importovaná ostrá sada se drží v `sessionStorage`; persistentní task databáze, obecný state i Batch snapshot vždy redigují `taskTitle/taskText/taskReqs` ostrého zadání, i při opt-in obnově citlivé práce.
- Starší persistentní kopie ostrého task contextu se při načtení migračně mažou; export JSON výslovně varuje, pokud obsahuje ostrou sadu.
- Přidán blokující repository secret scan do CI včetně detekce omylem commitnutého JSONu s neprázdným ostrým `taskText`; scanner je striktně omezen na kořen aplikace a `.gitignore` vyhrazuje soukromé názvy/adresář.
- Legacy ostrá sada byla již dříve zveřejněna ve veřejném GitHubu, proto musí být považována za kompromitovanou a pro skutečnou zkoušku nahrazena novou/rotovanou sadou uloženou mimo repozitář.
- Kvůli aktuálně nechráněné větvi `main` je veřejný GitHub Pages deployment pouze ruční (`workflow_dispatch`); kandidát před veřejným artefaktem fail-closed ověřuje `main.protected === true`. Push/PR dále spouští QA bez automatického nasazení.

## 1.5.16 — GARP 2.3 finalizační kolo po druhé Claude kontrole (2026-08-30)

- `state.genre` se po obnově běžného i Batch stavu whitelistuje proti aplikačnímu enumu a prompt používá výhradně whitelistovaný label bez raw fallbacku.
- Sdílený prompt-boundary harness pokrývá 28variantní AI-RED korpus přes šest primárních vstupů a sekundární validační retry (196/196 strukturálních pokusů).
- Validační retry už nepřipojuje modelový text do důvěryhodné instrukční pozice; předchozí validační chyby jsou vloženy jako escapovaný `REPAIR_VALIDATION_JSON` datový blok.
- Bezpečnostní regrese obsahují funkční ochranu obnovy `genre`, prompt fallbacku i repair-boundary a byly ověřeny mutačními negative controls.
- Jde o druhé a poslední automatické GARP kolo; distribuovaný kód se po druhé Claude kontrole změnil, proto Release Integrity zůstává AMBER bez nového výslovně zahájeného nezávislého cyklu.

## 1.5.15 — GARP 2.3 opravné kolo po Claude B (2026-08-29)

- rozšířená prompt trust-boundary pro zadání, povinné body, word-count audit i studentský text; 28variantní korpus běží přes 5 kanálů (140 strukturálních pokusů),
- funkční prompt-boundary kontrola přidána do `security-regressions` i `qa:security`,
- school-server build aplikuje vlastní same-origin CSP z `schoolServerProfile` do HTML a ověřuje shodu,
- error reporter fail-closed rediguje nelabelovaný lidský obsah, názvy souborů, telefony a canary; DOCX parser nevkládá filename do chyb,
- GitHub Pages artefakt se po QA a před uploadem zbavuje QA-only reportů,
- navazující kandidát vyžaduje druhou nezávislou Claude kontrolu podle GARP 2.3.

## 1.5.14 — GARP 2.3 bezpečnostní hardening (2026-08-29)

- Sjednoceny všechny AI cesty pod stejnou trust boundary: přímý Batch i školní gateway používají explicitní trusted instrukce a nedůvěryhodný studentský text zůstává oddělený.
- Odstraněn legacy AI bypass a latentní raw-series backend egress; školní profil je aplikačně fail-closed, same-origin a zakazuje lokální provider klíč.
- Interní studentský kód se již neposílá do AI promptu ani provider Batch metadata; párování používá kryptograficky náhodné opaque reference a lokální mapu.
- Citlivé lokální snapshoty expirují po 30 dnech a přibylo explicitní ukončení citlivé relace, které maže stav, dávku i provider klíče.
- Distribuční JSON už neexportuje sdílené tajemství; Apps Script egress zůstává omezen na explicitní allowlist a odeslání vyžaduje akci učitele.
- Rozšířeny GARP/AI-RED regrese, canary kontroly a negative controls pro trust boundary, same-origin, retention, secret export a prompt encoding.

## 1.5.13 — reakce na bezpečnostní audit Claude, kolo 1 (2026-08-24)

- Studentský text se do hodnoticího promptu vkládá jako JSON řetězec s escapovanými řídicími znaky; nemůže vytvořit druhý oddělovač ani předstírat systémovou instrukci.
- Validační brána ověřuje 1–2 doslovné citace také ve všech osmi bodovaných sekcích a odmítne důkaz, který ve studentském textu není.
- Hlavní aplikace i manuál obsahují CSP přímo v HTML, takže zákaz inline JavaScriptu platí také na GitHub Pages bez vlastních HTTP hlaviček.
- Přepis fotografií a PDF výslovně ignoruje pokyny uvnitř přílohy; kompatibilní Apps Script formulář izoluje nově otevřenou kartu.
- Bezpečnostní dokumentace rozlišuje tok do AI od toku skutečných jmen, e-mailů a výsledků přes Apps Script/Gmail a stanovuje pravidelnou kontrolu vendored JSZip.
- Konfigurace regresního testu reportéru nyní samostatně ukazuje na obsah manuálu a jeho externí přístupovou bránu; odstraňuje falešný pád GitHub Actions bez změny chování aplikace.

## 1.5.12 — bezpečnostní kandidát GARP (2026-08-24)

- Deployment konfigurace je zapečena do sestavení a její výpadek už nikdy nepřepne školní profil do otevřenějšího režimu; aplikace i manuál zůstávají fail-closed.
- Přístupový kontrakt používá aktuální veřejnou verzi z AI Studia `access-p1-20260824175535Z-k_wtm7Zj`.
- ZIP/DOCX import omezuje komprimovanou i rozbalenou velikost a odmítá nebezpečné cesty; import zadání používá výslovný seznam povolených polí.
- CSV exporty neutralizují formula injection a devítimístná telefonní čísla se automaticky pseudonymizují i bez oddělovačů.
- Apps Script tajemství a backendové access tokeny zůstávají pouze v aktuální relaci a nikdy se nezapisují do uloženého stavu.
- Metadata AI privacy odpovídají skutečnému průchodu kontrolou; fotografie/PDF se již falešně neoznačují jako klientsky anonymizované.
- Manuál a hlavní stránka nepoužívají spustitelný inline JavaScript; CSP povoluje skripty pouze ze stejného originu a školní profil přidává HSTS.
- Všechny externí GitHub Actions jsou připnuté na konkrétní neměnné revize a checkout neponechává token dostupný testům; synchronizační workflow aktivuje zápis až v posledním publikačním kroku.
- Vestavěná „ostrá maturitní“ sada zůstává na výslovné rozhodnutí autora beze změny a ve veřejném repozitáři ji nelze považovat za tajnou.

## 1.5.11 — sjednocení reportéru (2026-08-13)

- Reportér používá dvoukrokové vytvoření a skutečné stažení diagnostického ZIPu; Gmail je dostupný až po kliknutí na stažení.
- Texty výslovně požadují ruční přiložení ZIPu pomocí kancelářské sponky.
- Pomocné video je uvnitř reportéru, mimo obrazovku a skryté přes CSS i inline pojistku, aby nevznikal rekurzivní obraz.
- Regresní sada fyzicky ověřuje stažený ZIP, příjemce a obsah Gmail konceptu, screenshoty, jednu instanci, motivy, mobilní zobrazení a klávesnici.
- Hodnoticí workflow ani data studentů nebyly změněny; PWA cache je `ghrab-essay-evaluator-v1.5.11`.

## 1.5.10 — P5 (2026-08-05)


## 1.5.10 — P5 R2

- Opraven mobilní reflow.
- P5 R2 runtime audit se skripty a odemčeným UI.


- Předprodukční akceptace bez povinného školního serveru.
- Nulové otevřené automatické a11y nálezy jsou podmínkou P5 brány.
- Přidán aktualizovaný release-acceptance kontrakt a odložený GitHub upload.

# Changelog

## 1.5.8 — P4 FINAL (2026-08-04)

- Finální certifikace, čisté buildy, přístupnost, výkon, bezpečnost a release evidence.
- Přidána povinná `qa:p4:ci` brána.

## 1.5.7 - 2026-08-04 (P3)

- Platforma 1.1.0, pristupnost, performance budgety a modularizace P3.

## 1.5.6 — P2: sjednocení platformy GHRAB (2026-08-04)

- jeden kanonický školní logotyp a jednotná autorská patička;
- GHRAB Platform 1.0.0: motiv, storage namespace s vratnou migrací, Studio Bridge 2.0 a artifact envelope v1;
- jednotný název PWA cache `ghrab-essay-evaluator-v1.5.6` a řízená aktualizace;
- platformní konformitní test je součástí buildu a CI.


## 1.5.5 — P1 (2026-08-04)

- Produkční bezpečnost, serverový profil, datové manifesty a jednotná observability vrstva.
- GHRAB AI Core 1.0.0 a přepínání direct-gemini / school-gateway.

# Changelog

## 1.5.4 — 2026-08-04

- Etapa P0: opraven service worker bezpečnostní vrstvy, reportér je mimo kritickou cestu startu a aplikace získala server-ready deployment konfiguraci.
## 1.5.3 – Sjednocený technický reportér AI Studia

- aplikace používá právě jednu lokální instanci společného reportéru a centrální instanci vypíná přes `errorReporter: false`;
- otevřený reportér živě sleduje skutečný motiv `body.light`, podporuje až pět screenshotů, bezpečný koncept, ZIP a nativní Gmail odkaz;
- reportér, CSS i adaptér jsou součástí PWA precache a lokální manuál odkazuje na centrální návod;
- hodnoticí rubrika, vstupy, výsledky a data studentů nebyly měněny.

## 1.5.2 – Aktuální manuál v pracovním prostoru AI Studia

- interaktivní manuál byl sjednocen s funkcemi aktuálního Hodnotitele 1.5.2;
- tlačítko manuálu nyní otevírá příručku ve stejném rámci aplikace místo nové karty prohlížeče;
- opravná verze obnovuje PWA cache, aby se nový manuál načetl i ve dříve nainstalované aplikaci.

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
