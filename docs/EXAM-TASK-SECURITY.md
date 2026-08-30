# Bezpečnost ostrých maturitních zadání – 1.5.18

Ostrá zadání nejsou součástí veřejného zdrojového kódu ani buildu. Aplikace je načítá pouze explicitním JSON importem do aktuální browser relace.

## Důležité provozní pravidlo

Předchozí ostrá sada byla v minulosti obsažena ve veřejném repozitáři. Nelze ji proto nadále považovat za tajnou jen tím, že ji nová verze odstraní ze současného stromu. Pro budoucí ostrou zkoušku použij **nově vytvořenou/rotovanou sadu**.

Novou ostrou sadu:

- nikdy necommituj do veřejného GitHub repozitáře ani do CI artefaktů;
- uchovávej mimo repozitář v přístupově řízeném školním/soukromém úložišti;
- do aplikace ji importuj až při práci a po skončení použij „Ukončit citlivou práci“;
- pokud exportuješ JSON z aplikace, zacházej s ním jako s důvěrným zkušebním materiálem a při ručním uložení preferuj název odpovídající `*.exam-private.json` mimo veřejný repozitář.

Repozitář ignoruje adresář `private/` a běžné názvy `*.exam-private.json`, ale `.gitignore` není bezpečnostní hranice. CI navíc parsuje JSON a blokuje jak skutečný exportní/importní tvar s top-level větví `exam`, pokud v ní existuje položka s neprázdným `taskText`, tak i starší tvar objektu se `set: "exam"`. Ochrana tedy nezávisí na názvu souboru ani na pořadí vlastností.
