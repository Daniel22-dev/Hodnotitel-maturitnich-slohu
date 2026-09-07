# Hodnotitel maturitních slohů 1.5.24 — GARP 2.5.1 SHIELD-PREP corrective round

Tato verze reaguje na nezávislý Claude / role B review kandidáta 1.5.23.

## Uzavřené nálezy

- **N-01 / MEDIUM:** behaviorální GH-02 test je součástí kandidáta a obsahuje vlastní red-before-green mutaci guardu.
- **N-03 / MEDIUM + N-02 / LOW:** Service Worker už nepoužívá default-allow cacheFirst. CacheFirst je povolen pouze pro explicitní statický allowlist; neznámé same-origin assety jdou network-only/no-store.
- **N-04 / MEDIUM:** `maxProviderRequestsPerWorkflow` je pravdivě označen jako deklarace pro server/gateway, nikoli klientský enforcement.
- **EX-01:** online SCA uzavřeno na základě nezávislého review nad identickým dependency setem; lokální 1.5.24 rerun je kvůli EAI_AGAIN pouze NOT REPRODUCED. `qa:sca` je trvalý fail-closed CI krok.
- **N-05:** PREP gate nyní skutečně zahrnuje release registry / anti-rollback a provenance/evidence kroky. Chybějící upstream `verify-assurance-links.mjs` je explicitně označen SKIPPED; ekvivalentní aplikační cross-artifact verifier 10/10 PASS.
- **N-07/N-08:** chybějící build končí řízeným FAIL; secret pinning hashuje surové bajty.

## Neuzavřené externí / LIVE položky

School-server LIVE backend, LIVE headers/session/revocation/cross-user izolace, DAST, third-party SAST, provider retention/D2-D3 egress evidence, behaviorální AI-RED, produkční signing key/trust root/key custody a produkční CI provenance zůstávají NOT TESTED. Kandidát proto zůstává **AMBER / SHIELD-PREP** a není určen pro reálná studentská data.
