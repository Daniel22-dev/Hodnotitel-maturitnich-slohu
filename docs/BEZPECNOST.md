# Bezpečnost a ochrana údajů

## Citlivá data

Jméno, e-mail, třída, studentský text, fotografie, výsledné hodnocení, podpis učitele, vlastní komentáře a anonymizační mapa mohou obsahovat osobní údaje. Pracuj pouze na důvěryhodném školním nebo osobním zařízení.

## Co má zůstat lokálně

- roster se jmény a e-maily;
- párování skutečného studenta s pseudonymním kódem;
- názvy původních souborů;
- nastavení distribuce;
- anonymizační mapa;
- případná pseudonymní historie pokroku.

Do AI požadavku má odcházet pseudonymní kód, zkontrolovaný text a hodnoticí zadání. Před každým API během aplikace spouští privacy kontrolu.

## Ukládání

Citlivý obsah se standardně neukládá trvale. Bez výslovného zapnutí obnovy citlivé relace se při persistenci odstraní:

- studentský text a identita;
- výsledek a učitelská revize;
- roster;
- citlivé tokeny a tajemství;
- podpis učitele;
- vlastní komentářová banka.

Obnova citlivé relace patří pouze na vlastní zařízení. Její vypnutí nebo vymazání citlivé relace odstraní také pseudonymní historii.

## Pseudonymní historie

Historie je opt-in a ukládá pouze:

- pseudonymní kód;
- datum a identifikaci série;
- útvar a verzi rubriky;
- celkový počet bodů, známku, počet slov a osm dílčích bodů.

Neukládá text práce, jméno ani e-mail. Jednotlivý výsledek lze uložit až po finální učitelské kontrole; v dávce pouze schválené validní výsledky. Pro oficiální dlouhodobé sledování by měl být použit školní backend s pravidly uchování, přístupu a mazání.

## Anonymní analytika

Analytika používá jen schválené validní dávkové výsledky. Zobrazuje agregované počty, průměry, rozpětí a známky; neobsahuje jména, kódy, e-maily ani texty.

## Fotografie a PDF

Osobní údaj přímo v obrazu nelze bezpečně odstranit prostou textovou náhradou. Doporučený postup:

1. před nahráním oříznout identifikační záhlaví;
2. nechat vytvořit digitální přepis;
3. zkontrolovat nejistá místa;
4. potvrdit přepis učitelem;
5. pro hodnocení používat potvrzený text.

## Lokální knihovny

JSZip je součástí repozitáře v přesné verzi 3.10.1 a s licencí. Aplikace pro DOCX/ZIP/XLSX workflow nepoužívá externí CDN, čímž se snižuje riziko výpadku a nečekané změny třetí strany.

## API klíče

- nepřidávat do repozitáře;
- na sdíleném zařízení používat pouze relaci;
- pro školní provoz používat samostatný projekt;
- dlouhodobě přesunout klíč na školní backend.

## Distribuce

Aplikace povolí distribuci pouze výsledkům, které prošly validační bránou, mají právě jeden platný e-mail, nemají duplicitní adresu a byly schváleny učitelem. Doporučený režim je nejprve vytvořit Gmail koncepty.

## Apps Script

Webovou aplikaci nasazuj pod školním účtem. Sdílené tajemství patří do `Script Properties` pod názvem `SHARED_SECRET`; nevkládej jej do veřejného kódu. Dočasný bridge není rovnocenný serverovému tajemství, protože oprávněný uživatel jej může v prohlížeči zobrazit. Pro oficiální provoz přesuň distribuci i tajemství na backend.
