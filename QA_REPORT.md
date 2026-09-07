# QA report — Hodnotitel maturitních slohů 1.5.25 — GARP 2.5.1 SHIELD-PREP

Datum: 2026-09-07

## Rozsah 1.5.25
Cleanup po druhém nezávislém Claude review. Funkční logika hodnocení se nemění. Zavřeny jsou R2-N-01, R2-N-02, R2-N-03 a R2-N-04; N-06 (deterministické build timestampy) zůstává LOW/open.

## Reprodukované lokální kontroly
- projektové testy: **454/454 PASS**
- security regressions: **96/96 PASS**
- GARP R2 tooling selftest: **43/43 PASS**
- GHRAB Platform conformance: **118/118 PASS**
- `qa:sw-boundary`: **6/6 PASS** včetně defense-in-depth a plné sabotáže
- `qa:garp25`: **19/19 PASS** včetně assurance-verifier selftestu
- quality gate: **31/31 PASS**, `distBytes=1,169,923 <= 1,170,000`
- suite-session: **12/12 PASS**
- secret/security/PWA/technical/lock/XSS: **PASS**
- isolated browser: **PASS**
- deployment leak scan: **PASS** public i school-server
- PREP release gate: **GREEN 7/7**
- application assurance links nad přesným deployment ZIPem: **10/10 PASS**

## SCA
Claude Role B v kole 2 provedl online `npm audit` nad pěti uzamčenými dependency balíčky a získal **0 zranitelností**; jeho red-before-green kontrolní projekt vrátil 2 critical findings. V 1.5.25 se dependency package entries, resolved URL ani integrity hashe nemění; mění se jen root application version. Dependency-set fingerprint: `5d93e0e002ef849b73e787ca973fbc3056793c521032a5a3fa430ea2c823fd4f`.

Lokální rerun v ChatGPT sandboxu skončil `EAI_AGAIN`, proto není označen jako lokální PASS. `qa:sca` zůstává fail-closed krokem `qa:p5:ci` a nezávislé kolo 3 má audit nad 1.5.25 znovu reprodukovat.

## NOT TESTED / prostředí
- exact served-app runtime lifecycle: **NOT TESTED** — lokální runtime timeout
- axe served runtime: **NOT READY ENVIRONMENT**
- third-party SAST (CodeQL/Semgrep): **NOT TESTED**
- DAST: **NOT TESTED**
- school-server LIVE backend / reverse proxy / sessions / gateway: **NOT TESTED**
- LIVE hlavičky, revokace, cross-user isolation: **NOT TESTED**
- provider retention / D2-D3 provider-side egress evidence: **NOT TESTED**
- behaviorální AI-RED AIR-01..12 + ASR: **NOT TESTED**
- produkční signing key, trust root a key custody: **NOT TESTED**
- produkční trusted CI provenance: **NOT TESTED**

## Verdikt
**AMBER / SHIELD-PREP.** PREP release gate může být GREEN, ale nejde o school-server LIVE GREEN. Reálná studentská data zatím nepoužívat.
