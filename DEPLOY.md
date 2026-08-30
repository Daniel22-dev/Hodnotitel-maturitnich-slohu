# Nasazení Hodnotitele 1.5.18

Tato verze je GARP 2.3 kandidát pro poslední nezávislou Claude kontrolu. Do produkce se skutečnými studentskými daty ji nenasazujte, dokud finální protokol neuzavře povinné runtime/organizační brány.

## Bezpečný postup

1. Pracujte přes samostatnou větev a pull request; necommitujte přímo do `main`.
2. Před merge spusťte úplné CI. Workflow obsahuje blokující `qa:secrets` a P5 brány.
3. Na GitHubu nastavte ochranu `main` (branch protection / ruleset), povinné relevantní status checks a minimálně jeden nezávislý review. Doložte MFA a key custody oprávněných správců.
4. Veřejný GitHub Pages deploy je v 1.5.18 pouze ruční přes `workflow_dispatch`. Před uploadem artefaktu skript ověří přes GitHub API, že `main` je chráněná; jinak deploy skončí FAIL.
5. Po QA se spouští `prepare:pages`, který odstraní QA-only JSON z veřejného `dist/`.
6. Po nasazení proveďte served browser smoke/E2E: anonymní okno, Back/reopen, více tabů, SW update/recovery, cross-student A→B a canary/retention kontrolu.
7. Pro school-server profil ověřte na skutečném stagingu HTTP security headers, cookies/session, same-origin gateway a centrální authorization/permit pravidla.

## Ostrá maturitní zadání

Verze 1.5.18 neobsahuje skutečnou ostrou sadu ve zdroji ani buildu. Novou důvěrnou sadu uchovávejte mimo veřejný GitHub a importujte ji pouze do aktuální relace aplikace. Legacy ostrá sada byla v minulosti veřejně commitnuta a musí být považována za kompromitovanou; nepoužívejte ji jako budoucí tajný zkušební materiál.

Podrobnosti: `docs/RELEASE-SECURITY.md` a `docs/EXAM-TASK-SECURITY.md`.
