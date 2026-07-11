# Přidání do AI Studia GHRAB 0.6.3+

Po zveřejnění aplikace je nutné v repozitáři AI Studia doplnit čtyři konfigurace:

- `src/config/sources.json` — zdroj živého manifestu;
- `src/config/apps.fallback.json` — záložní karta aplikace;
- `src/config/access-policy.json` — školení `HOD-01` a label;
- `src/config/permissions.json` — oprávnění, riziko `high`, claim `app.essay-evaluator.use`.

Přesné hodnoty jsou v `src/studio-integration/essay-evaluator-registration.json`. Připravený skript `scripts/patch-ai-studio.mjs` umí změny provést automaticky, ale při práci pouze přes web GitHubu lze jednotlivé bloky vložit ručně.

Po aktualizaci Studia je nutné znovu vydat administrátorský i učitelské přístupové soubory tak, aby pole `apps` obsahovalo `essay-evaluator`.

## Nové capability ve verzi 1.3.0

Živý manifest navíc deklaruje:

- `professional-reports`;
- `a4-preview`;
- `styled-docx`;
- `teacher-comment-bank`;
- `anonymous-class-analytics`;
- `pseudonymous-progress`;
- `offline-docx-import`.

Při registraci zkontroluj, že karta ve Studiu načítá verzi `1.3.4` z živého `studio-manifest.json`. Přístupová politika se nemění: aplikace nadále pracuje s potenciálně citlivými školními daty a má zůstat za centrální ochranou AI Studia.

## Stav integrace 0.6.3

AI Studio 0.6.3 obsahuje živý zdroj manifestu, lokální ikonu, fallback kartu, školení HOD-01 a claim `app.essay-evaluator.use`. Workflow Hodnotitele po úspěšném nasazení odesílá událost `app-updated`, pokud je nastaven secret `AI_STUDIO_DISPATCH_TOKEN`.
