# QA report — Hodnotitel maturitních slohů 1.3.6

**Datum kontroly:** 12. 7. 2026  
**Stav:** připraveno k aktualizaci repozitáře a pokračování řízeného školního pilotu

## Automatická release brána

- **385/385 kontrol prošlo.**
- **0 chyb.**
- Zdroj obsahuje **19 JavaScriptových modulů** a **5 CSS modulů**.
- `npm run check` úspěšně provedl testy i reprodukovatelný build.
- Ověřena syntaxe zdrojových modulů, `dist/app.js` a `dist/access-bootstrap.js`.
- Ověřena stabilní PWA identita, navigační fallback service workeru, jediný kanonický asset loga a absence starých manifestů.
- Funkční testy pokrývají parser skupiny, DOCX parser a generátor, převod bodů, klíčové kombinace `finalizeEvaluation`, zlaté vzorky word-countu, odstranění base64 dat ze snapshotu a pseudonymizaci identity.

## Výsledek buildu

- verze: **1.3.6**;
- rubrika: **2026.04.27-r1**;
- PWA manifest: `manifest.webmanifest`;
- cache service workeru: odvozená z verze v `package.json`;
- nasaditelná složka: `dist/`.

## Ruční smoke test po nasazení

1. Otevřít aplikaci přes AI Studio s platným oprávněním.
2. Ověřit, že explicitně nepovolený uživatel zůstane uzamčen.
3. Po prvním online načtení přejít offline a ověřit zobrazení varovného pruhu nouzového režimu.
4. Nainstalovat PWA, provést další update a ověřit aktualizaci stejné instalace bez duplikátu.
5. Vložit syntetický jednořádkový seznam e-mailů a ověřit import.
6. Zahájit dávku s obrázkem, obnovit relaci a ověřit výzvu k opětovnému přiložení přílohy.
7. Vygenerovat testovací DOCX a zkontrolovat logo, tabulky a podpis.

Živé volání Gemini, Apps Script a vzdálený modul přístupové brány vyžadují samostatný integrační smoke test v nasazeném prostředí.
