# QA report — Hodnotitel maturitních slohů 1.5.26 — GARP 2.5.1 SHIELD-PREP

Datum: 2026-09-15

## Rozsah 1.5.26
Kumulativní kontrola oprav z etapy 1 (N5 deployment secret scanner) a etapy 2 (GitHub deploy governance) + patch bump 1.5.25 → 1.5.26. Funkční logika Hodnotitele se tímto patchem nemění.

Uzavřeno:
- N5 secret scanner nyní fail-closed odmítá privátní JWK (`kty` + `d`), PGP private key block a zachovává detekci encrypted/private PEM,
- `main` je chráněná větev a povinný GitHub status check je `p5-release-gate`,
- deploy governance odmítá nechráněnou `main`, chybějící nebo nesprávný required check a deploy z jiné větve,
- legacy P4 workflow je manual-only; kanonická automatická release brána je P5.

## Nezávisle reprodukované kontroly nad 1.5.26
- projektové testy: **454/454 PASS**
- security regressions: **100/100 PASS**
- `qa:garp25`: **22/22 PASS**
- GHRAB Platform conformance: **118/118 PASS**
- quality gate: **31/31 PASS**
- suite-session: **12/12 PASS**
- browser QA: **PASS**
- XSS sink regression inventory: **PASS**
- `qa:sw-boundary`: **6/6 PASS**
- syntax N5 scanner / governance / GARP QA: **PASS**
- secret scan: **PASS, 0 nálezů**
- lock audit: **PASS**

## GitHub CI a governance
Na release 1.5.26 před touto metadata-only opravou proběhly `p5-release-gate`, `quality` a `axe` úspěšně. `main` zůstává protected a `p5-release-gate` je required check.

Ruční workflow `GHRAB QA and deploy` následně správně skončilo fail-closed ještě před deployem, protože tento soubor `QA_REPORT.md` zůstal omylem na verzi 1.5.25. Tato změna opravuje právě tento release-metadata drift; po tomto commitu musí proběhnout čerstvé CI a nový ruční deploy workflow.

## SCA / prostředí
Lokální `qa:p5:ci` v ChatGPT sandboxu nebylo možné dokončit přes online `npm audit`, protože prostředí nemělo funkční DNS/přístup k `registry.npmjs.org` (`EAI_AGAIN`). Tento lokální stav není vydáván za PASS ani za chybu aplikace. Dependency verze se mezi 1.5.25 a 1.5.26 nemění; SBOM 1.5.26 byl znovu vygenerován pro nový root artefakt.

Lokální `qa:runtime` skončil timeoutem `Runtime page timeout: index.html`; stejná třída timeoutu byla reprodukována i na předchozím nezměněném kandidátu. Tento lokální test proto není přeznačen na PASS.

## NOT TESTED / mimo rozsah tohoto patche
- third-party SAST (CodeQL/Semgrep): **NOT TESTED**
- DAST: **NOT TESTED**
- school-server LIVE backend / reverse proxy / sessions / gateway: **NOT TESTED**
- LIVE hlavičky, revokace a cross-user isolation: **NOT TESTED**
- provider retention / D2-D3 provider-side egress evidence: **NOT TESTED**
- behaviorální AI-RED AIR-01..12 + ASR: **NOT TESTED**
- produkční signing key, trust root a key custody: **NOT TESTED**
- produkční trusted CI provenance: **NOT TESTED**

## Verdikt
**AMBER / SHIELD-PREP; repository-level release 1.5.26 je po kódové a bezpečnostní stránce GREEN.** Tento patch uzavírá N5 scanner a GitHub deploy governance, ale neprohlašuje school-server LIVE GREEN. Po této metadata opravě je nutné nechat doběhnout nový `p5-release-gate` a znovu spustit `GHRAB QA and deploy` pro skutečné publikování 1.5.26 na GitHub Pages.
