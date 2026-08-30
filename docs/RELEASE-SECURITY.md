# Release security – Hodnotitel 1.5.18

Veřejný GitHub Pages deploy je záměrně **fail-closed**:

1. deployment lze spustit pouze ručně přes `workflow_dispatch`;
2. před uploadem Pages artefaktu skript `verify-github-deployment-governance.mjs` přes GitHub API ověří, že větev `main` má `protected: true`;
3. pokud `main` chráněná není nebo API nelze ověřit, deployment skončí FAIL;
4. CI vždy spouští `qa:secrets` a P5 R2 bránu.

Pro GARP GREEN musí vlastník repozitáře navíc doložit nastavení MFA / key custody a skutečně nakonfigurovat branch protection (např. povinný PR/review a relevantní status checks). Samotný soubor v repozitáři toto nastavení nemůže zapnout.

## Ostrá maturitní zadání

Legacy ostrá sada byla již zveřejněna v dřívějším veřejném stromu a musí být považována za kompromitovanou. Verze 1.5.18 ji z aktuálního zdroje a buildu odstraňuje, ale tím nemaže Git historii ani existující klony/cache. Pro skutečnou ostrou zkoušku je nutná nová/rotovaná sada uložená mimo veřejný repozitář; viz `docs/EXAM-TASK-SECURITY.md`.
