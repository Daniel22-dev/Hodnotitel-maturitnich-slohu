# Změny a opravy ve verzi 1.3.0

## Report Studio

- dva vizuální režimy: formální školní a přívětivý studentský;
- přepínatelný A4 náhled;
- volitelný podpis nebo iniciály učitele;
- bodová mapa všech osmi kategorií;
- tři prioritní karty: co udržet, co zlepšit a co příště kontrolovat;
- třídění chyb na kritické, opakující se a jednorázové;
- automatický revizní miniúkol;
- kontrola souladu komentáře, kategorií, součtu a známky.

## Výstupy

- nový profesionální DOCX se školním logem, styly nadpisů, tabulkami, zvýrazněním a podpisem;
- stejné pedagogické doplňky se propisují do náhledu, TXT, DOCX, tisku/PDF a studentské e-mailové šablony;
- dávkové exporty používají správný kontext každého studenta;
- odstraněny staré překryté implementace DOCX, PDF a reportu.

## Pedagogické funkce

- komentářová banka učitele s přednastavenými i vlastními větami;
- anonymní třídní analytika se souhrnem bodů, známek a průměrů v osmi kategoriích;
- analytika zahrnuje pouze výsledky, které jsou validní a schválené učitelem;
- pseudonymní historie pokroku umožňuje porovnat bodové výsledky stejného kódu v čase;
- jednotlivý výsledek lze uložit do historie až po finální učitelské kontrole.

## Offline provoz a závislosti

- JSZip 3.10.1 je přibalen lokálně včetně MIT licence;
- ZIP, DOCX a XLSX exporty již nepoužívají CDN fallback;
- import běžného DOCX byl převeden na lokální čtení `word/document.xml`;
- odstraněna externí závislost Mammoth;
- service worker ukládá lokální JSZip do cache.

## Bezpečnost a soukromí

- bez zapnuté obnovy citlivé relace se trvale neuchovává podpis učitele ani vlastní komentářová banka;
- pseudonymní historie je výchozí vypnutá a ukládá jen kód, datum, bodové hodnoty, útvar a verzi rubriky;
- historie nikdy neukládá text práce, jméno ani e-mail;
- vymazání citlivé relace odstraní také pseudonymní historii;
- anonymní analytika nevystavuje kódy studentů ani jejich texty.

## Regresní a technické opravy

- každá kritická exportní funkce má jedinou implementaci;
- aktualizován identifikátor verze v backendové hlavičce a registračním souboru AI Studia;
- doplněny testy privacy pravidel, lokálního DOCX parseru a struktury vytvořeného Word souboru;
- testovací sada má 341 kontrol bez chyby.

Podrobný technický rozbor je v souboru `AUDIT_REPORT_1.3.0.md`.
