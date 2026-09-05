# QA report — Hodnotitel maturitních slohů 1.5.20

> Opravný kandidát po skutečné GitHub Actions validaci verze 1.5.19, 2026-09-05. Použita výhradně syntetická data. Kandidát zůstává **AMBER** a vyžaduje nový post-upload served-runtime/axe průchod na GitHub Actions.

## Proč vznikla verze 1.5.20

GitHub Actions nad kandidátem 1.5.19 (commit `58e3a3955d1adf8685e875ac665f15a02cdf04d0`) odhalily dvě konkrétní blokace, které lokální sandboxová browser omezení před zabalením 1.5.19 nezachytila:

1. `qa:runtime`: 3/3 init failures hlavní stránky (1280, 390 a 320 px) se stejným `ReferenceError: initBackendAdapter is not defined` v `bootstrapApplication()`.
2. `qa:axe`: 6 serious color-contrast nálezů = stejné 3 elementy GHRAB footeru při 1280 a 390 px. Naměřeno `3.68:1` (`#617686` na `#0d1b28`) proti požadovaným `4.5:1`.

## Opravy 1.5.20

- Z `src/js/99-bootstrap.js` bylo odstraněno omylem přidané volání neexistujícího `initBackendAdapter()`. Backend inicializace se neduplikuje; existující wiring zůstává v `initSeriesWorkflow()` / `syncBackendToFields()`.
- Do aplikačního `src/styles/90-product-shell.css` přibylo pouze `.app-footer .ghrab-platform-footer__slot{color:var(--t2)}`. Platform 1.1.2 vendor nebyl upraven ani forkut.
- Podpůrný WCAG výpočet po Platform opacity `0.72`: dark theme přibližně `7.45:1`, light theme přibližně `4.96:1`. Jde o statický podpůrný důkaz, nikoli náhradu post-fix axe běhu.
- `tests/test.mjs` nově blokuje návrat neexistujícího backend initializeru i odstranění lokálního kontrastního footer override.
- Verze aplikace byla konzistentně zvýšena na `1.5.20`; Platform zůstává `1.1.2`.

## Post-fix ověření 1.5.20

- `npm test`: **531/531 PASS** (`436` projektových + `95` security).
- GHRAB Platform conformance: **116/116 PASS**.
- Suite-session lifecycle QA: **12/12 PASS**, včetně fail-closed a povinného negative control; poslední syntetický marker `GARP-STUDENT-CANARY-912FD02F47DE9322`.
- P3 quality: **31/31 PASS**, performance budget nebyl navýšen.
- `qa:security`: **PASS, 0 nálezů**.
- `qa:pwa`: **PASS, 0 nálezů**.
- `qa:xss`: **PASS** proti existujícímu baseline inventory.
- `qa:lock`: **PASS**.
- `qa:secrets`: **PASS, 0 nálezů**.
- `qa:technical`: **PASS, 0 nálezů**.
- `npm audit --omit=dev --audit-level=high`: **0 vulnerabilities**.
- Error reporter: statická část **52 PASS / 0 FAIL**; browser část **NOT_READY** kvůli spravované Chromium `URLBlocklist`.
- `qa:critical`: **NOT TESTED / environment limitation** — lokální `playwright` balík není dostupný (`ERR_MODULE_NOT_FOUND`).
- `qa:visual`: **NOT TESTED / environment limitation** — stejná chybějící `playwright` závislost.
- `qa:browser`: **PASS** pouze pro izolovaný `Page.setDocumentContent` kontrakt, stejně jako dříve; není to served-app důkaz.
- Oba distribuční buildy (`dist`, `dist-school-server`) mají verzi 1.5.20, neobsahují `initBackendAdapter()` call a obsahují app-level footer override.
- Referenční vendor Platform 1.1.2 je byte-for-byte shodný s AI Studio 0.21.40 pro `ghrab-platform.js`, `ghrab-platform.css`, artifact schema a app-registry schema.
- `qa:runtime` post-fix lokálně: **NOT TESTED / environment limitation**. Sandbox znovu končí `Runtime page timeout: index.html` ještě před použitelným served-page auditem; tento lokální výsledek se nepřeznačuje na PASS ani aplikační FAIL.
- `qa:axe` post-fix lokálně: **NOT TESTED / environment limitation**. Exact `axe-core` není po nedokončeném `npm ci` v sandboxu dostupné a served Chromium je navíc omezené; rozhodující je nový GitHub Actions běh.
- Aktivní lokální `qa:p5`: **BLOCKED / environment limitation** na `qa:runtime`; kroky před ním (secrets, lock, build, Platform conformance, suite-session, quality, isolated browser) prošly.

## Release gate 1.5.20

- SECURITY: **AMBER**
- PRIVACY: **AMBER**
- RED TEAM: **AMBER**
- RELEASE INTEGRITY: **AMBER**
- OVERALL: **AMBER**

Povinný další důkaz: nahrát přesný kandidát 1.5.20 a zopakovat GitHub Actions tak, aby `qa:runtime` ukázalo `bootError: ""`, `initFailures: 0` a `qa:axe` nemělo žádný serious/critical blocker. Teprve poté lze hodnotit další release podmínky. E-01, F-02 a F-03 zůstávají ekosystémové follow-upy a tato child oprava je sama neuzavírá.

TESTOVACÍ PROVOZ POUZE SE SYNTETICKÝMI DATY  
REÁLNÁ STUDENTSKÁ DATA: NEPOUŽÍVAT

---

## Historický report kandidáta 1.5.19 před opravou

# QA report — Hodnotitel maturitních slohů 1.5.19 (historický kandidát před CI opravou)

> Cílená migrace child aplikace na **GHRAB Platform 1.1.2 / `ghrab-suite-session-v1`**, 2026-09-05. Použita výhradně syntetická data. PASS je uveden pouze tam, kde existuje provedený důkaz; nedostupné served-runtime, providerové a organizační hranice zůstávají `NOT TESTED` / `NOT READY`.

## Aktuální ověření 1.5.19 — Platform 1.1.2 release-wave kandidát

- Projektová sada: `434 PASS / 0 FAIL`.
- Cílené bezpečnostní regrese: `95 PASS / 0 FAIL`; celkem `npm test = 529/529 PASS`.
- Funkční prompt-boundary korpus: `28` mutací × `7` nedůvěryhodných promptových kanálů = `196/196 PASS`.
- GHRAB Platform conformance: `116/116 PASS`.
- Suite-session lifecycle QA: `12/12 PASS` v izolovaném Chromium/CDP harnessu nad skutečnou produkční cleanup implementací a referenční Platformou 1.1.2.
- Povinný negative control suite-session: handler záměrně vypnut v odhoditelné testovací instanci -> canary zůstal a ACK nevznikl (`EXPECTED FAIL`); po návratu čisté implementace stejný scénář opět `PASS`.
- Fail-closed control: syntetické selhání `removeItem` -> cleanup `failed`, reziduum zůstalo detekováno, `cleanup-complete` ani suite ACK nevznikly.
- P3 quality: `31/31 PASS`, budget nebyl navýšen; generovaný suite QA report je správně vyloučen z produkčního size budgetu.
- Security QA: `PASS, 0 nálezů`; PWA QA: `PASS, 0 nálezů`; Technical QA: `PASS, 0 nálezů`; repository secret scan: `PASS, 0 nálezů`; lock audit: `PASS`; `npm audit --omit=dev --audit-level=high`: `0 vulnerabilities`.
- XSS sink QA: `PASS` jako regresní inventura; sama o sobě není důkazem bezpečnosti každého HTML sinku ani ochrany same-origin trust boundary.
- `qa:browser`: `PASS` pouze pro izolovaný `Page.setDocumentContent` kontrakt (`resourceCount: 0`), nikoli pro served-app lifecycle.
- `qa:runtime`: `NOT TESTED / environment limitation` — spravovaný Chromium blokuje lokální HTTP/file navigaci; pokus končí timeoutem na `index.html`.
- `qa:axe`: `NOT TESTED / environment limitation` — runtime report je `not-ready-environment`, `scanned: 0`; exact `axe-core` závislost nebyla v sandboxu po neúspěšném `npm ci` dostupná.
- `qa:critical`: `NOT TESTED / environment limitation` — lokální `playwright` balík chybí; dva pokusy o `npm ci` v sandboxu doběhly do timeoutu, proto výsledek není přeznačen na PASS.
- `qa:visual`: `NOT TESTED / environment limitation` — stejná chybějící `playwright` závislost (`ERR_MODULE_NOT_FOUND`).
- Error reporter: statická část `52 PASS / 0 FAIL`; browser část `NOT_READY` kvůli spravované Chromium `URLBlocklist`.
- Aktivní `qa:p5` release gate: `BLOCKED` na `qa:runtime` (`Runtime page timeout: index.html`); před blokací znovu prošly secret scan, lock audit, build, Platform conformance, suite-session `12/12`, quality `31/31` a isolated browser QA. Pozdější kroky stejného řetězce proto nejsou vydávány za PASS.
- Přímý `qa-p5-release`: `43/44`, `FAILED` pouze kvůli chybějícímu `qa-p5-runtime-report.json`; `qa-p5-acceptance`: `13/15`, `FAILED` ze stejného runtime důvodu a navazujícího neúspěšného release reportu.
- Legacy `qa:release`: `NOT TESTED / environment limitation` — skutečně spuštěn, ale zůstal viset na `npm ci --no-fund` a musel být ukončen; po něm byl `dist` znovu čistě sestaven.
- `qa:github-governance`: `SKIP` mimo GitHub Actions; branch protection/MFA/key custody se z lokálního ZIPu neověřují.
- Živý produkční AI model/provider, Apps Script, e-mail, school backend, produkční identita ani skutečná studentská data nebyly použity.

## Změna 1.5.19 — suite-session lifecycle / E-01

Poslední syntetický cleanup canary: `GARP-STUDENT-CANARY-516A3C3A614D928D`. Jde výhradně o syntetická testovací data; doprovodný `@example.invalid` marker je uložen pouze v QA evidence.

- Vendor Platform 1.1.2 je převzat bitově kompatibilně z referenčního AI Studia 0.21.40; globální Platforma nebyla svévolně forkuta ani zvýšena nad 1.1.2.
- `release-acceptance.json` pro 1.5.19 pravdivě deklaruje `ecosystem-wave-candidate`, `currentUseApproved: false`, `e01Closed: false` a syntetická data do dokončení release wave; zděděné `pre-production-accepted` metadata z 1.5.18 byla odstraněna.
- PC-01 byl zopakován proti skutečným runtime writerům, nikoli jen manifestu. Opraven byl zejména chybějící `maturitniHodnotitelTasksSessionV117`, skutečný legacy batch session klíč `maturitniHodnotitelBatchProgressSessionV078` a příliš široký wildcard `ghrab.essay-evaluator.*`.
- Manifest nyní odděluje pracovní/student-related obsah a credentials s `clearOnEndWork: true` od neobsahových nastavení, usage metrik, lifecycle tombstones/ACK a statických cache, které se bez důvodu nemažou.
- `src/access/suite-session-cleanup.js` registruje Platform 1.1.2 `session.onEnd`, eviduje `signal observed`, provede vlastní cleanup + read-back verification, zapíše `cleanup-complete` a teprve poté explicitně ACKne generaci.
- Při chybě storage se cleanup neoznačí jako dokončený a nevznikne falešný ACK.
- Persistence lock blokuje autosave/writery po zahájení suite cleanupu, aby více karet, stale stránka nebo Back/Forward nevrátily starý obsah.
- Lokální reconcile chrání i závod se sdíleným per-app ACK: kontext se stale sessionStorage provede vlastní cleanup, i když jiná karta už stejnou generaci globálně potvrdila.
- Replay/idempotence, multi-context, stale-history model, fail-closed a negative control jsou součástí blokujícího `qa:suite-session`.

## F-02 — acknowledgement

Lokálně jsou rozlišitelné čtyři stavy: (1) globální suite signal/tombstone existuje, (2) tato aplikace signal viděla (`suite-session-observed`), (3) tato aplikace dokončila a ověřila cleanup (`suite-session-cleanup-complete`), (4) tato aplikace generaci potvrdila Platformě (`suite-session-seen`). ACK se zapisuje až po úspěšném cleanupu.

**F-02 ale není ekosystémově uzavřeno:** Platforma 1.1.2 sama neagreguje seznam povinných child ACKů do důkazu, že celý ekosystém dokončil úklid. To vyžaduje navazující změnu koordinátoru/AI Studia a společný release-wave test všech child aplikací.

## F-03 — same-origin trust boundary

Současný návrh je first-party same-origin Web Storage. Libovolný kompromitovaný same-origin child/XSS proto může technicky zapsat globální suite tombstone nebo per-app ACK jiné aplikace a může ovlivnit stav jiného same-origin namespace. Child 1.5.19 omezuje vlastní storage ownership a chrání se proti neúmyslnému ACK race, ale nemůže tuto hranici kryptograficky vyřešit bez globální architektonické změny. F-03 zůstává otevřený ekosystémový LOW/structural debt.

## GARP gate 1.5.19

- SECURITY: **AMBER**
- PRIVACY: **AMBER**
- RED TEAM: **AMBER**
- RELEASE INTEGRITY: **AMBER**
- OVERALL: **AMBER**

Důvod AMBER: migrovaný child má cílený suite cleanup a lokální fail-closed důkazy, ale strict GARP GREEN nelze vydat bez skutečného served-browser E2E pro relevantní SIM/RT scénáře, behaviorálního AIR proti přesnému produkčnímu modelu, nezávislé kontroly přesného 1.5.19 kandidáta a společného ekosystémového ověření F-02/E-01. **E-01 není tímto child kandidátem uzavřeno.**

TESTOVACÍ PROVOZ POUZE SE SYNTETICKÝMI DATY  
REÁLNÁ STUDENTSKÁ DATA: NEPOUŽÍVAT

---

## Historický report 1.5.18

Níže je zachován předchozí GARP 2.3 report pro auditní kontinuitu. Nejde o aktuální gate kandidáta 1.5.19.

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
