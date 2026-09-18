# Final audit — Hodnotitel maturitních slohů 1.5.28

Datum: 2026-09-18  
Standard: GARP 2.5 + N5 + Safe Promotion + AI Studio auto-patch — Master prompt v1.1  
Profil: GARP 2.5.1 SHIELD-PREP / assurance `TRANSITIONAL`

## Autoritativní aktuální identita

Tento report záměrně nehardcoduje SHA svého vlastního budoucího merge commitu. Přesná produkční identita se po každém úspěšném deployi zapisuje do veřejného `release-integrity.json` a je před `app-updated` ověřena `verify:live-release`.

Stabilní identita tohoto release:
- appId: `essay-evaluator`
- verze: `1.5.28`
- GHRAB Platform: `1.1.2`
- GARP profil: `GARP-2.5.1-SHIELD-PREP`
- assurance: `TRANSITIONAL`
- AI Studio release-wave: `essay-evaluator = 1.5.28`
- AI Studio Safe Promotion baseline po doplnění Testu I / policy enforcement: merge PR #23 do `main` `c709221a37f5309c38bd57f728f6de90f267fab4`

Přesný finální Hodnotitel source commit + artifact digest po merge tohoto auditu musí být čten z live `release-integrity.json`; tím se předchází self-referential evidence driftu.

## Povinné testy Master promptu

### Test A — pozitivní Safe Promotion
PASS. Hodnotitel opakovaně prošel `candidate → P5 → PR → protected main → deploy → live verification → app-updated`. Poslední plně uzavřený pozitivní cyklus před tímto reportem: main `ec75f9f7c6512860254e168e74052c02841b9059`, deploy run `35339454037` = GREEN včetně `qa-build`, Pages deploy a `notify-ai-studio`.

### Test B — GARP fail
PASS. Controlled candidate `a70f7924a7045f37c9503aacec38f9c941b5576d` změnil pouze hashově připnutý GARP scanner. P5 run `35342438838`, job `105591201428` = FAIL přímo v `qa:garp25` na:
- `software-integrity.tooling-and-vendored`
- `software-integrity.negative-controls`

`main` se nezměnil a produkční deploy se nespustil. Candidate byl po testu vrácen na produkční main.

### Test C — N5 fail
PASS. Controlled candidate `12d3f4cd4a7b7e1caa863e0878820d4a8abccdf7` vložil čistě syntetický private-JWK fixture do `dist` až těsně před `qa:garp25`, aby rozhodoval přímo N5 scanner. P5 run `35342797447`, job `105592353228` = FAIL na:
- `deployment.leak-scan.dist`
- `deployment.leak-scan.dist-school-server`

Předchozí QA kroky byly GREEN; `main` ani produkce se nezměnily. Permanentní `qa:garp25` navíc při každém release testuje všechny sjednocené N5 třídy: private JWK `d`, PGP private key a encrypted private PEM. Testovací candidate byl následně vrácen na produkční main.

Poznámka: dřívější experimentální N5 běh, který nejprve narazil na performance budget, se za Test C nepovažuje.

### Test D — povolený PATCH
PASS. Hodnotitel `1.5.27 → 1.5.28` prošel ověřením live release identity, AI Studio auto-patch změnil release-wave, Studio P5 byl GREEN a změna prošla Safe Promotion do Studio main.

### Test E — duplicate dispatch
PASS. AI Studio ingest `35336957396` a později `35338398070` ověřily již přijatou 1.5.28 a skončily:
- 0 auto-patch promotions
- `release wave unchanged`
- `safe NO-OP`

### Test F — concurrent duplicate dispatch
PASS. Reálné ingest runy `35337041026` a `35337128564` byly serializovány a oba skončily GREEN/NO-OP bez druhé promotion, rollbacku, non-fast-forward chyby nebo smyčky. Trvalý `test:auto-patch-idempotence` je povinnou součástí Studio P5 a ověřuje `duplicate=CURRENT; concurrent duplicate=serialized/NO-OP; wave unchanged`.

### Test G — minor/major rejection
PASS a povinně v P5. `test:release-promotion` ověřuje `NON_PATCH_CHANGE` pro minor/major. Od Studio candidate `c79ebb02f0f3f73312e3e1169920f72d248228ee` je tento test přímo součástí `qa:p5` i `qa:p5:ci`; required P5 run `35343176748` = GREEN a log obsahuje `Release promotion policy tests: PASS`.

### Test H — rollback rejection
PASS a povinně v P5. Stejná release-promotion regrese ověřuje `ROLLBACK` a je součástí required P5.

### Test I — manifest contract regression
PASS a povinně v P5. `scripts/test-release-promotion.mjs` obsahuje negativní fixture bez `platform.requiredPlatformRange`; očekává `PLATFORM_RANGE` a blokuje auto-patch. Změna prošla Studio Safe Promotion PR #23 do protected main `c709221a37f5309c38bd57f728f6de90f267fab4`.

## Definition of Done

| Oblast | Stav | Empirický důkaz |
|---|---|---|
| aktuální repo nejprve analyzováno | PASS | forenzní inventura před změnami |
| novější tooling nebyl slepě přepsán | PASS | zachován GARP 2.5.1 R2 + app-specific hardening |
| GARP 2.5 tooling | PASS | selftest 43/43 + tooling SHA integrity |
| GARP povinně v CI | PASS | `qa:garp25` v P5/P5 CI |
| GARP povinně před release | PASS | P5 + prepare-pages release chain |
| fail-closed empiricky | PASS | GARP run `35342438838` |
| N5 JWK `d` | PASS | permanent fixture + E2E run `35342797447` |
| N5 encrypted PEM | PASS | permanent `qa:garp25` negative control |
| N5 private PGP | PASS | permanent `qa:garp25` negative control |
| N5 fixture testy permanentní | PASS | součást `scripts/qa-garp25.mjs` |
| candidate workflow | PASS | P5 na candidate |
| candidate FAIL nemění main | PASS | Test B/C |
| candidate PASS může automaticky do main | PASS | Safe Promotion |
| main protected | PASS | required `p5-release-gate`, PR ruleset |
| required checks | PASS | candidate + PR P5 |
| deploy pouze z main | PASS | deployment-origin governance |
| manifest po post-process validní | PASS | Platform 118/118 + `prepare:pages` + release-chain |
| release identity commit+artifact | PASS | `ghrab-release-integrity-v2` |
| GARP/SBOM/evidence stejný release | PASS | SHA vazby + provenance/evidence verifiers |
| app-updated až po deploy | PASS | Pages deploy → live verify → dispatch |
| Studio pouze vyšší PATCH | PASS | `test:release-promotion` povinně v P5 |
| rollback odmítnut | PASS | Test H |
| minor/major odmítnut | PASS | Test G |
| Studio nepíše přímo do main | PASS | durable candidate → P5 → PR → protected main |
| Studio promotion projde gate | PASS | PR #23 + required P5 |
| duplicate event NO-OP | PASS | Test E |
| concurrent duplicate bez konfliktu | PASS | Test F |
| evidence aktuálního artefaktu | PASS | live `release-integrity.json` je kanonická autorita |
| staré GREEN reporty nejsou current proof | PASS | historické reporty jsou explicitně historické |
| dočasné helpery odstraněny | PASS | controlled RED změny byly resetovány; žádný nový testovací workflow/branch nezůstal |
| nevyřešený P1 blocker standardu | PASS | žádný pro SHIELD-PREP patch-only release chain |

## Architektonická odchylka od doslovného „per-app concurrency“

Master doporučuje per-app concurrency. AI Studio však zapisuje všechny aplikace do jednoho sdíleného `src/config/release-wave.json` a jednoho durable `candidate`. Proto je záměrně použit globální serializační lock `ai-studio-auto-patch-ingest` s `cancel-in-progress: false`, kontrolou `BASE_SHA` proti remote candidate a explicitním NO-OP.

Toto je přísnější serializace než per-app paralelismus. Zavedení samostatných per-app locků bez rozdělení sdíleného write modelu by umožnilo dvěma různým aplikacím současně zapisovat do stejného candidate/release-wave a vytvořilo by nový cross-app race. Podle Master pravidla pro konflikt standardu se proto zachovává bezpečnější globální model. Empirický Test F potvrzuje požadovaný výsledek bez konfliktu.

Stejně tak Studio používá jednu deterministickou durable branch `candidate` a kanonický `candidate → main` PR namísto paralelních `auto-patch/<app>/<version>` větví. Díky globální serializaci, stale-write guardu a explicitnímu NO-OP poskytuje tato konkrétní architektura stejnou bezpečnostní vlastnost bez nekontrolovaných přímých zápisů do main.

## Relevantní workflow

Hodnotitel:
- `P5 R2 pre-production release gate`
- `Safe Promotion controller`
- `GHRAB QA and deploy`
- `Blocking axe-core audit`
- `Legacy quality entrypoint (delegates to P5 R2)`

AI Studio:
- `AI Studio auto-patch ingest`
- `P5 R2 pre-production release gate`
- `Safe Promotion controller`
- `Sync, certify and deploy AI Studio GHRAB`

## Změny dokončující Master v1.1

Permanentní:
- AI Studio `scripts/test-release-promotion.mjs`: manifest-contract negative regression.
- AI Studio `package.json`: `test:release-promotion` povinně v `qa:p5` a `qa:p5:ci`.
- Hodnotitel tento finální audit / evidence refresh.

Dočasné controlled-negative změny pro Test B/C nejsou součástí výsledného source tree.

## Známé limity mimo SHIELD-PREP

Assurance zůstává korektně `TRANSITIONAL`: není zaveden produkční signing key/trust-root custody. Tento standard také neprohlašuje school-server LIVE reverse proxy/session/gateway, third-party SAST/DAST ani behaviorální live-model AI-RED AIR-01..12 za otestované. Nejde o P1 blocker tohoto Master promptu pro SHIELD-PREP patch-only release chain, ale nesmí se zaměňovat za production cryptographic assurance nebo school-server LIVE certifikaci.
