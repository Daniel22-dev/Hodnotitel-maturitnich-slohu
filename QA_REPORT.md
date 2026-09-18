# QA report — Hodnotitel maturitních slohů 1.5.28 — GARP 2.5.1 SHIELD-PREP

Datum: 2026-09-18

## Rozsah 1.5.28
Oprava dispatch payloadu do AI Studia. Verze 1.5.27 prošla celou release cestou včetně
publikace na GitHub Pages a živého ověření manifestu; selhal až poslední krok:
`client_payload` měl 19 top-level vlastností a GitHub REST API jich povoluje 10
(HTTP 422). Payload se nově staví v testovatelném skriptu, release identita je vnořená
a payload má 9 top-level vlastností.

## Puvodni rozsah (1.5.27)
Kumulativní bezpečnostní a governance delta nad 1.5.26 podle Master promptu
„GARP 2.5 + N5 + Safe Promotion + automatický auto-patch AI Studia" (v1.1).
Funkční logika hodnocení, rubrika, prompty, UI ani práce se studentskými daty se nemění.

Uzavřeno:
- integrita samotného bezpečnostního toolingu je nově vynucena — všech 14 vendorovaných
  GARP 2.5.1 nástrojů se hashově ověřuje proti `GARP-2.5.1-TOOLING-SHA256SUMS.txt`,
- `build-provenance` a `security-evidence-manifest` se nově skutečně ověřují, nejen generují,
- `prepare:pages` končí fail-closed regresí celého řetězce release identity,
- `app-updated` odchází až po omezeném retry ověření skutečně publikovaného manifestu,
- dispatch payload nese release identitu, ne jen řetězec verze,
- release záznam rozlišuje `PREP-VALIDATION` a `LIVE-PUBLIC-PAGES`,
- lokální build se nevydává za ověřený GitHub Actions builder.

## Reprodukované kontroly nad 1.5.28
- projektové testy: **459/459 PASS**
- security regressions: **129/129 PASS**
- `qa:garp25`: **24/24 PASS**
- release chain regression: **38/38 PASS**
- software integrity + negativní kontroly: **PASS**
- GHRAB Platform conformance: **118/118 PASS**
- quality gate: **31/31 PASS**
- `qa:sw-boundary`: **PASS**
- error reporter regression (`test:reporter`): **PASS**
- secret scan: **PASS, 0 nálezů**
- lock audit: **PASS**
- XSS sink regression inventory: **PASS**

Negativní kontroly provedené na skutečných artefaktech, nikoli deklarované:
oslabení N5 scanneru zastaví `qa:garp25`; poškozený, podvržený i nepřihlášený nástroj
je odmítnut; jeden bajt navíc v SBOM nebo odstraněná položka platform kontraktu shodí
release chain; nesoulad digestu, verze, commitu nebo originu shodí živé ověření;
záznam z P5 gate se nedá vydat za živý release.

## GitHub CI a governance
Běh 95381159019 nad `main` SHA `e4bb33da3daf133b667017f6c85ff05175291a31` doložil zelené
`qa-build`, úspěšný deploy na GitHub Pages a PASS živého ověření publikovaného manifestu
na první pokus z osmi (`artifactDigest d994795a…`, `releaseStage LIVE-PUBLIC-PAGES`).
Selhal pouze poslední krok — dispatch do AI Studia; důvod viz Rozsah 1.5.28.

Předchozí běh nad `main` SHA `5fedb04546a46a0d8f282c8c0fd7b1760b16d1ce`
doložil, že `main` je protected, `p5-release-gate` je required status check a že tento
SHA pochází z merged PR #9 `candidate -> main`. Safe Promotion tedy prokazatelně funguje.

Týž běh skončil fail-closed před deployem, protože tento soubor zůstal na verzi 1.5.26 —
`QA_REPORT.md` je v `reporter-test.config.json` veden mezi `versionPaths`. Nic se
nepublikovalo a AI Studio nedostalo žádné oznámení. Stejná třída chyby nastala už
u 1.5.26. Proto 1.5.28 navíc:
- zařazuje `test:reporter` do `qa:p5` i `qa:p5:ci`, aby regrese spadla na `candidate`
  a ne až po merge do chráněné `main`,
- přidává do `npm test` generickou kontrolu, že každý soubor z `versionPaths`
  obsahuje verzi z `package.json`.

## Neprovedeno v lokálním prostředí
Browser QA (`qa:browser`, `qa:runtime`, `qa:axe`, `qa:suite-session`) a na ně navázané
`qa-p5-release` a `qa-p5-acceptance` lokálně neběžely — prostředí nemá Chromium.
Online `npm audit` (`qa:sca`) tamtéž neběžel. Ani jedno není přeznačeno na PASS;
důkazem bude běh `p5-release-gate` v GitHub Actions.

## NOT TESTED / mimo rozsah tohoto patche
- third-party SAST (CodeQL/Semgrep): **NOT TESTED**
- DAST: **NOT TESTED**
- school-server LIVE backend / reverse proxy / sessions / gateway: **NOT TESTED**
- LIVE hlavičky, revokace a cross-user isolation: **NOT TESTED**
- provider retention / D2-D3 provider-side egress evidence: **NOT TESTED**
- behaviorální AI-RED AIR-01..12 + ASR: **NOT TESTED**
- produkční signing key, trust root a key custody: **NOT TESTED**

## Verdikt
**AMBER / SHIELD-PREP.** Aplikační GARP/N5/Safe Promotion část a patch-only auto-patch cesta do AI Studia jsou uzavřené a empiricky doložené. Assurance zůstává `TRANSITIONAL` — release identita je strojově ověřená, ale bez produkčního podpisu. Neprohlašuje se school-server LIVE GREEN, third-party SAST/DAST ani produkční signing.


## Aktuální audit 2026-09-18
- Lokální reprodukce nad přesným zdrojovým balíčkem 1.5.28: GARP selftest **43/43 PASS**, build + Platform conformance **118/118 PASS**, `qa:garp25` **24/24 PASS**, projektové testy **459/459 PASS**, security regressions **129/129 PASS**.
- GREEN Safe Promotion dokumentačního cyklu: candidate `b4faf52201d8ce1bc87bdd0f9232ba3cc79766a4`, PR #14, PR-level P5 run `35336634654`, následně merge do main `9f285f54c5d03945766fe87dd91f44ec1dedd8b1`; `candidate` byl po merge synchronizován na stejný SHA.
- Live release 1.5.28 z tohoto cyklu byl AI Studiem ověřen jako `VERIFIED` se source commit `9f285f54c5d03945766fe87dd91f44ec1dedd8b1` a artifact digest `116086ee7ab926b6e39a667b8bde9470c29d6c05289393f77cbf58383d86ba91`.
- Řízený negativní test 2026-09-18: candidate commit `d5ffc5829066a5048ce592700b6843d4e25c41ca` obsahoval pouze záměrný version drift `package.json 1.5.29` proti lock/evidence. Required `p5-release-gate` run `35336247793` skončil **FAIL**, produkční `main` se nezměnil a deploy se nespustil. Candidate byl následně obsahově vrácen na 1.5.28.
- **Test E — duplicate dispatch, reálné E2E:** Hodnotitel deploy run `35336755506` po live verifikaci odeslal znovu `app-updated` pro již přijatou 1.5.28. AI Studio ingest run `35336957396` skončil **PASS**: release identity VERIFIED, **0 auto-patch promotion**, `release wave unchanged`, `safe NO-OP`.
- **Test F — concurrent duplicate, reálné E2E:** dva identické AI Studio ingest runy `35337041026` a `35337128564` byly rerunovány současně (attempt 2). První byl `in_progress`, druhý zůstal `pending` do jeho dokončení; oba následně skončily **PASS**, **0 promotions**, `release wave unchanged`, `safe NO-OP`. AI Studio `main` i `candidate` zůstaly na `2d4ec4095d3176e1ca118b5503ea1d45ef2f406c` a `essay-evaluator` zůstal na 1.5.28.
- Trvalá regrese idempotence/concurrency je součástí AI Studio P5 (`test:auto-patch-idempotence`); její zavedení prošlo P5 runem `35336430979` a Safe Promotion PR #22 do main `2d4ec4095d3176e1ca118b5503ea1d45ef2f406c`.
- Produkční signing key/trust-root custody zůstává vědomě mimo SHIELD-PREP: assurance mode je nadále **TRANSITIONAL**, nikoli kryptograficky uzavřený production signing.
