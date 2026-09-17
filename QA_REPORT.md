# QA report — Hodnotitel maturitních slohů 1.5.27 — GARP 2.5.1 SHIELD-PREP

Datum: 2026-09-17

## Rozsah 1.5.27
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

## Reprodukované kontroly nad 1.5.27
- projektové testy: **454/454 PASS**
- security regressions: **121/121 PASS**
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
Běh `GHRAB QA and deploy` nad `main` SHA `5fedb04546a46a0d8f282c8c0fd7b1760b16d1ce`
doložil, že `main` je protected, `p5-release-gate` je required status check a že tento
SHA pochází z merged PR #9 `candidate -> main`. Safe Promotion tedy prokazatelně funguje.

Týž běh skončil fail-closed před deployem, protože tento soubor zůstal na verzi 1.5.26 —
`QA_REPORT.md` je v `reporter-test.config.json` veden mezi `versionPaths`. Nic se
nepublikovalo a AI Studio nedostalo žádné oznámení. Stejná třída chyby nastala už
u 1.5.26. Proto 1.5.27 navíc:
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
- strana AI Studia (patch eligibility, Studio safe promotion, duplicitní a souběžný
  event): **MIMO TENTO REPOZITÁŘ**

## Verdikt
**AMBER / SHIELD-PREP.** Aplikační strana standardu je uzavřená a doložená.
Assurance zůstává `TRANSITIONAL` — release identita je strojově ověřená, ale bez
produkčního podpisu. Neprohlašuje se school-server LIVE GREEN ani hotový auto-patch
AI Studia.
