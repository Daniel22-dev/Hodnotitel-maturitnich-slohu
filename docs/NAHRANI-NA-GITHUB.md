# Nahrání na GitHub přes webové rozhraní

Repozitář a napojení do AI Studia zatím mohou zůstat odložené. Až bude verze schválena:

1. vytvoř veřejný repozitář `Hodnotitel-maturitnich-slohu`;
2. rozbal ZIP;
3. nahraj obsah rozbalené složky přímo do kořene repozitáře;
4. commit pojmenuj například `Hodnotitel 1.3.4 – Report Studio a finální hardening`;
5. v `Settings → Pages` nastav zdroj `GitHub Actions`;
6. počkej, až workflow `Build and deploy` doběhne zeleně;
7. ověř `studio-manifest.json`, PWA a přímou adresu;
8. teprve potom přidej registraci `essay-evaluator` do centrálního AI Studia a přístupové politiky.

Do repozitáře nikdy nenahrávej API klíč, Apps Script tajemství, seznam studentů, exportované výsledky ani fotografie prací.
