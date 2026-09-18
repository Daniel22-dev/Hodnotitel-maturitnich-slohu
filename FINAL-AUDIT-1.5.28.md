# Final audit — Hodnotitel maturitních slohů 1.5.28

Datum: 2026-09-18
Standard: GARP 2.5 + N5 + Safe Promotion + AI Studio auto-patch (master v1.1)
Profil: GARP 2.5.1 SHIELD-PREP / assurance TRANSITIONAL

## Finální identita

- Hodnotitel `main` = `candidate`: `ecdafa33f9cfa00e15decf84287d1bbbdf77cd6c`
- AI Studio `main` = `candidate`: `2d4ec4095d3176e1ca118b5503ea1d45ef2f406c`
- AI Studio release-wave `essay-evaluator`: `1.5.28`
- Nejnovější live identity Hodnotitele ověřená Studiem: source commit `ecdafa33f9cfa00e15decf84287d1bbbdf77cd6c`, artifact digest `2f9708f7d13e35947867e95280d98791a5b03b9b90255412db743e7621976b3c`.

## Empirické důkazy

- Exact-source lokální reprodukce: GARP selftest **43/43 PASS**, Platform **118/118 PASS**, `qa:garp25` **24/24 PASS**, projektové testy **459/459 PASS**, security regressions **129/129 PASS**.
- Controlled fail-closed: candidate `d5ffc5829066a5048ce592700b6843d4e25c41ca`, P5 run `35336247793` = **FAIL**; `main` se nezměnil a deploy se nespustil.
- Positive Safe Promotion: Hodnotitel prošel candidate → PR → protected main; aktuální `main` i `candidate` jsou synchronizované na `ecdafa33f9cfa00e15decf84287d1bbbdf77cd6c`.
- Live deploy/dispatch: publikovaný release byl před `app-updated` znovu ověřen; Studio následně ověřilo release identity.
- Reálný duplicate E2E: ingest `35336957396` = **PASS**, 0 promotions, `release wave unchanged`, safe NO-OP.
- Aktuální opakovaný duplicate: ingest `35338398070`, job `105578489549` = **PASS**; `Release identity essay-evaluator: VERIFIED 1.5.28 commit=ecdafa33... artifact=2f9708...`, 0 promotions, `release wave unchanged`, safe NO-OP.
- Concurrent duplicate: reálné ingest běhy `35337041026` a `35337128564` byly serializovány concurrency group; oba skončily PASS/NO-OP bez druhé promotion. Trvalá regresní sada `test:auto-patch-idempotence` navíc běží v P5 a empiricky spouští dvě paralelní NO-OP aplikace; P5 run `35336430979` = PASS s výstupem `duplicate=CURRENT; concurrent duplicate=serialized/NO-OP; wave unchanged`.
- Rollback a minor/major jsou permanentně blokovány release-promotion regresí.

## Definition of Done

| Oblast | Stav | Empirický důkaz |
|---|---|---|
| GARP 2.5 tooling | PASS | selftest 43/43 + hash integrity |
| GARP povinně v CI | PASS | `qa:garp25` v P5 |
| GARP před release | PASS | fail-closed release chain |
| N5 JWK `d` | PASS | permanent negative fixture |
| N5 encrypted PEM | PASS | permanent negative fixture |
| N5 private PGP | PASS | permanent negative fixture |
| candidate workflow | PASS | candidate P5 |
| main protected | PASS | required `p5-release-gate`, enforcement everyone |
| required checks | PASS | candidate i PR-level checks |
| bad candidate blocked | PASS | run 35336247793 FAIL |
| good candidate promoted | PASS | Safe Promotion do protected main |
| deploy only from main | PASS | deployment origin governance |
| manifest contract | PASS | Platform 118/118 + release-chain tests |
| app-updated after deploy | PASS | live verification před dispatch |
| Studio patch eligibility | PASS | verified deployment identity + patch-only policy |
| Studio safe promotion | PASS | candidate/P5/PR/main |
| duplicate dispatch | PASS | run 35336957396 + 35338398070 NO-OP |
| concurrent duplicate | PASS | runs 35337041026 / 35337128564 + permanent P5 regression |
| rollback blocked | PASS | release-promotion regression |
| minor/major blocked | PASS | release-promotion regression |
| current evidence | PASS | QA_REPORT + APP sheet aktualizovány na 1.5.28 |

## Známé limity mimo tento SHIELD-PREP cíl

Assurance zůstává `TRANSITIONAL`: není zaveden produkční signing key/trust-root custody. Tento audit také neprohlašuje school-server LIVE reverse proxy/session/gateway, third-party SAST/DAST ani behaviorální live-model AI-RED za otestované. Tyto položky nejsou nevyřešeným P1 blockerem patch-only Safe Promotion/auto-patch standardu, ale nesmí se zaměnit za production cryptographic assurance nebo school-server LIVE certifikaci.
