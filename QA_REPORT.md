# QA report — Hodnotitel maturitních slohů 1.5.18

> Třetí, uživatelem výslovně autorizované GARP 2.3 kolo, 2026-08-30. Použita výhradně syntetická data. PASS je uveden jen tam, kde existuje provedený důkaz; nedostupné runtime/provider/organizační hranice zůstávají NOT TESTED / NOT READY.

## Aktuální ověření 1.5.18

- Projektová sada: `434 PASS / 0 FAIL`.
- Cílené bezpečnostní regrese: `86 PASS / 0 FAIL`.
- GHRAB Platform conformance: `111/111 PASS`.
- Repository secret scan: `PASS, 0 nálezů`.
- Security QA: `PASS, 0 nálezů`; PWA QA: `PASS, 0 nálezů`; Technical QA: `PASS, 0 nálezů`.
- P3 quality: `31/31 PASS`, `0 warnings`; precache `1 085 654 <= 1 100 000 B`.
- Lock audit: PASS.
- Statická část sjednoceného error reporteru: `52 PASS / 0 FAIL`; browser část reportéru `NOT_READY` kvůli spravované Chromium `URLBlocklist`.
- XSS sink inventory: PASS jako regresní inventura; sama o sobě není důkazem bezpečnosti každého HTML sinku.
- Funkční prompt-boundary korpus: `28` mutací přes `7` nedůvěryhodných promptových kanálů = `196/196 PASS`.
- `qa:browser`: PASS pouze pro izolovaný `Page.setDocumentContent` kontrakt (`resourceCount: 0`), nikoli pro served-app lifecycle.
- `qa:runtime`: FAIL/NOT READY v tomto prostředí: `Runtime page timeout: index.html`.
- `qa:axe`: `not-ready-environment`, `scanned: 0`.
- Přímý pokus spustit systémový Chromium končí timeoutem už na triviálním `data:` dokumentu; browser lifecycle proto není přeznačen na PASS.
- Živý produkční AI model, Apps Script, e-mail, skutečný school backend ani produkční session/identity nebyly v tomto kole volány.

## Změny třetího kola

### D-08 — ostrá maturitní zadání

- Skutečné ostré zadání už není součástí `src/js/10-task-database.js`, `dist/app.js` ani school-server buildu.
- Budoucí důvěrná sada se načítá explicitním JSON importem pouze do aktuální browser relace.
- Úplná task databáze se drží v `sessionStorage`; persistentní localStorage dostává jen placeholdery ostré sady.
- Persistentní obecný state i persistentní Batch snapshot vždy redigují `taskTitle`, `taskText` a `taskReqs` pro `set === 'exam'`, a to i při zapnutém opt-in ukládání citlivé práce.
- Starší persistentní ostrý task context se při obnově rediguje před `Object.assign` a přepisuje sanitizovanou hodnotou.
- Export databáze varuje, pokud JSON obsahuje ostrou sadu.
- CI secret scan parsuje skutečný exportní/importní JSON tvar s top-level větví `exam` a blokuje jakýkoli neprázdný `taskText` uvnitř ní; zachována je i detekce legacy tvaru `set: "exam"`. `.gitignore` zůstává pouze první vrstvou.
- Důležitá provozní skutečnost: legacy ostrá sada byla již dříve commitnuta ve veřejném GitHub repozitáři. Odstranění z 1.5.18 nemaže Git historii, klony ani cache. Tato stará sada musí být považována za kompromitovanou a pro skutečnou zkoušku nahrazena novou/rotovanou sadou mimo veřejný repozitář.

### RT-16 / release governance

- Do CI a release workflow je zapojen blokující `qa:secrets`.
- GitHub Pages deploy se již nespouští automaticky pushnutím do `main`; veřejný upload/deploy je pouze `workflow_dispatch`.
- Před veřejným artefaktem běží `qa:github-governance`, který fail-closed vyžaduje `main.protected === true` z GitHub API.
- Externě ověřený současný stav repozitáře: `main` je nyní nechráněná a repository rulesets jsou prázdné. Kandidát tedy správně veřejný deploy zablokuje, dokud vlastník ochranu větve skutečně nenastaví.
- MFA, key custody, nativní GitHub secret scanning a přesná pravidla review/status checks nelze z tohoto ZIPu potvrdit a zůstávají externími podmínkami GREEN.

## Negative controls třetího kola

Všechny mutace proběhly pouze v jednorázových kopiích mimo kandidáta:

1. odstranění redakce ostrého task contextu z persistentního state -> `security-regressions` správně FAIL;
2. syntetický `.env` / fake API-key pattern -> `qa-secret-scan` správně FAIL;
3. návrat automatického `push main` Pages deploye -> `security-regressions` správně FAIL;
4. syntetický legacy JSON s `set: "exam"` a neprázdným `taskText` -> `qa-secret-scan` správně FAIL;
5. B3-01 negative control: syntetický JSON přesně ve skutečném exportním tvaru `{"practice":...,"exam":...}` -> `qa-secret-scan` správně `SECRET SCAN FAIL`.

Čistý strom po negative controls: `86/86 PASS` a secret scan `0 nálezů`.

## Zbývající blokátory GREEN

- Centrální autorizace/permit kryptografie, token confusion, role, revokace a časové limity: RT-01/03/04/11 a relevantní SIM-01/02 vyžadují skutečný centrální guard/backend.
- Browser lifecycle: multi-tab, Back/reopen, cache, cross-student A→B izolace, plný retention/deletion a SW recovery vyžadují funkční served E2E prostředí; RT-06/17/20 a SIM-03/04/07 nelze z tohoto prostředí plně uzavřít.
- Behaviorální AI-RED proti přesnému produkčnímu modelu nebyl proveden. Strukturální `196/196` není live-model attack-success rate; relevantní AIR zůstává behaviorálně NOT TESTED.
- Produkční HTTP security headers, session cookies a živý school backend nebyly runtime ověřeny; statický school-server build má správnou same-origin CSP.
- Aktuální GitHub `main` není chráněná; před GREEN musí vlastník skutečně zapnout branch protection/ruleset a doložit MFA/key custody. Kandidát 1.5.18 pouze zajišťuje, že bez ochrany větve odmítne veřejný deploy.
- Legacy ostrá sada je již veřejně kompromitovaná; pro ostrý provoz je nutná nová/rotovaná sada, která nikdy nevstoupí do veřejné Git historie.
- Poslední nezávislá Claude kontrola 1.5.17 potvrdila všechny předchozí opravy a našla jediný MEDIUM nález B3-01 v CI scanneru. Verze 1.5.18 je přesně tato cílená oprava. Protože po poslední nezávislé kontrole došlo ke změně release/CI kódu, Release Integrity zůstává konzervativně AMBER bez čtvrtého nezávislého kola.

## Gate po cílené opravě posledního Claude nálezu B3-01

- SECURITY: **AMBER**
- PRIVACY: **AMBER**
- RED TEAM: **AMBER**
- RELEASE INTEGRITY: **AMBER**
- OVERALL: **AMBER**

Důvod AMBER nejsou známé neopravené HIGH/CRITICAL/MEDIUM chyby v kandidátu: B3-01 je opraven. AMBER drží skutečně otevřené externí/runtime důkazy, aktuálně nechráněný veřejný `main` a absence dalšího nezávislého auditu přesného 1.5.18 artefaktu.

TESTOVACÍ PROVOZ POUZE SE SYNTETICKÝMI DATY  
REÁLNÁ STUDENTSKÁ DATA: NEPOUŽÍVAT
