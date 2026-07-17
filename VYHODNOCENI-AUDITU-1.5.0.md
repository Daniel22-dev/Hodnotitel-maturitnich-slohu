# Nezávislé vyhodnocení auditu — Hodnotitel maturitních slohů 1.4.0 → 1.5.0

## Celkový verdikt

Audit je technicky velmi kvalitní a ve svých hlavních závěrech správný. Všech pět kritických nálezů bylo potvrzeno přímo ve zdrojovém kódu a následně opraveno. Správná je také hlavní pozitivní teze auditu: architektura deterministického bodování a validační brány je zdravá a nebylo nutné ji přepisovat.

## Stav jednotlivých skupin

| Skupina | Verdikt | Stav ve verzi 1.5.0 |
|---|---|---|
| K1–K5 | potvrzeno | opraveno + regresní testy |
| V1–V4 | potvrzeno | opraveno + regresní testy |
| V5 | reálné provozní riziko, ne programátorská chyba | zadání ponechána; riziko výslovně dokumentováno, čeká na rozhodnutí autora |
| V6 | potvrzeno | README, CHANGELOG, UI changelog a QA sjednoceny na 1.5.0 |
| S1–S9 | potvrzeno / opodstatněno | opraveno |
| S10–S11 | skutečný mrtvý kód | odstraněno |
| S12 | potvrzená repozitářová hygiena | build vytváří čistý `dist/`, doplněn seznam souborů ke smazání |
| S13–S14 | potvrzeno | opraveno |
| N1–N5, N7–N8 | převážně oprávněné | opraveno |
| N6 | nízkoprioritní zjednodušení | ponecháno; nemá vliv na hodnocení ani bezpečnost |

## Důležité nuance

- V5 nelze „bezpečně opravit“ pouhou změnou kódu bez rozhodnutí, kde bude neveřejný soubor uložen a jak jej budou učitelé distribuovat. Proto nebyla ostrá témata svévolně odstraněna.
- S1 měl platnou podstatu bez ohledu na přesnou hranici verze Safari: lookbehind v regex literálu může způsobit parse-time pád v nepodporovaném prohlížeči. Přepsání bez lookbehind je levnější a robustnější než deklarace minimální verze.
- U V1 nebyl žánr zachován jako samostatný důkaz nadpisu. Nadpis musí mít skutečný strukturální nebo typografický signál.
- U K5 nestačilo jen přestat přiřazovat `job.raw`; přidán byl whitelist i při zápisu a čtení stavu, aby se vyčistily také případné starší relace.
- U K3 se kódy odvozují i z výsledků, nikoli pouze z aktuálně viditelných prací. Tím se zabrání opětovnému použití kódu po odebrání práce, která už měla výsledek.

## Ověření

Původní sada měla 388 zelených kontrol, ale významná část byla statická. Verze 1.5.0 má **415 PASS / 0 FAIL** a doplňuje dynamické scénáře přes Node VM. Úspěšně proběhl také reprodukovatelný build `dist/`.
