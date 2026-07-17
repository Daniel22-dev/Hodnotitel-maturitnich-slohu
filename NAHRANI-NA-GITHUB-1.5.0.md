# Nahrání Hodnotitele 1.5.0 na GitHub

## Doporučený postup

1. Stáhněte a rozbalte distribuční ZIP verze 1.5.0.
2. Nahrajte **obsah ZIPu přímo do kořene repozitáře Hodnotitele**, nikoli jako další vnořenou složku.
3. Nechte přepsat existující soubory.
4. Podle `FILES-TO-DELETE-1.5.0.txt` odstraňte staré legacy soubory, pokud v repozitáři ještě existují. Pouhé nahrání nové složky je samo nesmaže.
5. Commit pojmenujte například: `Release 1.5.0 - audit fixes`.
6. V záložce **Actions** vyčkejte na zelený test/build/deploy.
7. Otevřete GitHub Pages a proveďte ruční smoke test popsaný v `QA_REPORT_1.5.0.md`.

## Co je nutné nahrát

Nahrajte celý obsah balíčku včetně:

- `src/`, `tests/`, `scripts/`, `integrations/`, `docs/`;
- `.github/workflows/`;
- `package.json`, README, CHANGELOG a dokumentace 1.5.0;
- čistého `dist/`, protože repozitář jej záměrně ponechává i když Pages build vzniká znovu v CI.

## Co po nahrání ověřit

- Actions: testy končí `415 PASS / 0 FAIL`;
- build hlásí verzi 1.5.0;
- aplikace i manuál se otevírají přes AI Studio;
- PWA se aktualizuje jako stejná aplikace, nevznikne druhá instalace;
- ruční AI režim zobrazuje instrukci k JSONu a import vytváří běžný report;
- fotka/PDF bez přepisu nejde rovnou hodnotit.

## Poznámka k ostrým zadáním

Vestavěná ostrá sada zůstává ve veřejném zdroji. To znamená, že není tajná. Přesun do neveřejného JSON importu je samostatná změna a nebyl v tomto release proveden bez výslovného rozhodnutí autora.
