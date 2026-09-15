# Hodnotitel maturitních slohů 1.5.26 — N5 + GitHub governance delta

Datum: 2026-09-15

## Rozsah

Bezpečnostní a release-governance patch nad 1.5.25. Funkční logika hodnocení maturitních slohů, rubrika, prompt workflow a práce se studentským obsahem se nemění.

## Etapa 1 — N5 secret scan

- `scan-deployment-leaks.mjs` doplněn o detekci privátního JWK (`kty` + privátní parametr `d`) a PGP private-key bloku.
- Zachována existující detekce encrypted/private PEM.
- `qa:garp25` obsahuje negativní kontroly, které musí všechny tři třídy odmítnout.
- Veřejný JWK bez privátního `d` není blokován pouze kvůli formátu JWK.

## Etapa 2 — GitHub deploy governance

- `verify-github-deployment-governance.mjs` vyžaduje `main.protected === true`.
- Zároveň vyžaduje required status check `p5-release-gate`.
- Governance je fail-closed při nechráněné větvi, prázdném seznamu required checks i při nesprávném checku.
- GitHub `main` byla následně nastavena jako protected s required checkem `p5-release-gate`.

## Evidence a hranice tvrzení

Historické GARP 2.5.1 SHIELD-PREP artefakty 1.5.25 nejsou přepisovány ani vydávány za nově vytvořenou 1.5.26 evidenci. Verze 1.5.26 je delta nad tímto baseline a musí projít vlastní aktuální CI po nahrání na GitHub.

LIVE school-server, DAST, produkční signing/key custody a další dříve otevřené externí body tímto patchem nejsou uzavřeny.
