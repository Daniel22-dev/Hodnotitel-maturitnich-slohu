# Hodnotitel maturitních slohů 1.5.21 – CI runtime bootstrap hotfix

Datum: 2026-09-05

## Důvod

Skutečný GitHub Actions served-runtime audit kandidáta 1.5.20 ukázal tři init failures hlavní stránky (1280/390/320 px). Přesný auditní artefakt uvádí `ReferenceError: renderRelease is not defined` v `bootstrapApplication()`. Současně potvrzuje, že předchozí axe problém byl opraven (`critical: 0`, `serious: 0`).

## Oprava

- odstraněno neexistující volání `renderRelease()`;
- přidána explicitní regrese pro `renderRelease()`;
- přidána souhrnná kontrola všech app-owned bootstrap hooků;
- Platform 1.1.2 vendor ani suite-session implementace nebyly měněny.

## Release policy

Kandidát zůstává AMBER / ecosystem-wave-candidate. Produkční použití ani reálná studentská data nejsou povolena, dokud nový přesný ZIP neprojde post-upload GitHub Actions runtime/axe/release gate a není dokončena koordinovaná Platform 1.1.2 ecosystem release wave.
