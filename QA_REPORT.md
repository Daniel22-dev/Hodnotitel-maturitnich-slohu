# QA report — Hodnotitel maturitních slohů 1.5.29 — GARP 2.7 r2 / G-02

Datum: 2026-09-25

## Rozsah 1.5.29
Bezpečnostní a governance migrace na GARP 2.7 r2 / G-02 bez změny maturitní rubriky, scoringu, promptového významu, UI nebo pedagogického workflow. GARP 2.5.1/N5 zůstává zachován jako regresní baseline. Školní server je nadále DEFERRED_BY_OWNER_DECISION; LIVE stav je NOT_TESTED.

Lokální ověření migrace zahrnuje GARP 2.7 package/contract selftest, G-02 policy admission, architecture-integrity, mutation testy, auto-patch contract, GHRAB Platform conformance a úplné aplikační/security regrese. Exact live release identity a online browser P5 evidence vznikají až v GitHub Actions po Safe Promotion.

Aktuální lokální výsledek 1.5.29:
- projektové testy: 459/459 PASS
- security regressions: 129/129 PASS
- GHRAB Platform: 118/118 PASS
- GARP 2.7 architecture integrity: 31/31 PASS
- GARP 2.7 mutation scenarios: 10/10 PASS
- GARP 2.7 FOUNDATION: 8/8 PASS — FOUNDATION_PASS_LIVE_NOT_TESTED

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


## Aktuální audit 2026-09-18 — Master v1.1 closure

Autoritativní podrobný stav je v `FINAL-AUDIT-1.5.28.md`; přesná aktuální live source/artifact identita se po deployi čte z `release-integrity.json`, nikoli ze staticky hardcodovaného SHA v tomto reportu.

Nově empiricky uzavřeno:
- **Test B / GARP fail:** candidate `a70f7924a7045f37c9503aacec38f9c941b5576d`, P5 run `35342438838`, job `105591201428` = FAIL na software-integrity GARP toolingu; main/deploy beze změny.
- **Test C / N5 fail:** candidate `12d3f4cd4a7b7e1caa863e0878820d4a8abccdf7`, P5 run `35342797447`, job `105592353228` = FAIL přímo na `deployment.leak-scan.dist` a `deployment.leak-scan.dist-school-server`; main/deploy beze změny. Permanentní N5 regression nadále obsahuje JWK `d`, private PGP i encrypted private PEM.
- **Test G/H/I / Studio acceptance policy:** `test:release-promotion` je nyní povinnou součástí Studio `qa:p5` i `qa:p5:ci`; ověřuje minor/major rejection, rollback rejection a chybějící povinnou manifest položku. Required P5 run `35343176748` = PASS; změna prošla Studio Safe Promotion PR #23.
- **Duplicate/concurrent:** reálné ingest běhy `35336957396`, `35337041026`, `35337128564` a `35338398070` potvrzují GREEN/NO-OP, bez druhé promotion a bez rollbacku.
- Exact-source lokální reprodukce 1.5.28: GARP selftest **43/43 PASS**, Platform **118/118 PASS**, `qa:garp25` **24/24 PASS**, projektové testy **459/459 PASS**, security regressions **129/129 PASS**.

Assurance zůstává vědomě **TRANSITIONAL / SHIELD-PREP**: production signing key/trust-root custody není zaveden a tento report netvrdí school-server LIVE, third-party SAST/DAST ani behaviorální live-model AI-RED.
