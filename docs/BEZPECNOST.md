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

Sdílené tajemství Apps Scriptu a přístupový token budoucího backendu se neukládají nikdy, ani při zapnuté obnově citlivé relace. Po obnovení stránky se musí zadat znovu.

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

Správce aplikace nejméně jednou za čtvrtletí a před každým vydáním ověří oficiální vydání JSZip a zveřejněná bezpečnostní upozornění. Při aktualizaci zaznamená verzi, licenci a kontrolní součet souboru, znovu sestaví aplikaci a spustí regresní testy importu ZIP/DOCX/XLSX. Vendored kopie se nemění bez tohoto ověření.

## API klíče

- nepřidávat do repozitáře;
- na sdíleném zařízení používat pouze relaci;
- pro školní provoz používat samostatný projekt;
- školní sestavovací profil lokální provider klíče zakazuje;
- dlouhodobě přesunout klíč na skutečný školní backend; tento repozitář zatím obsahuje pouze jeho kontrakt a klientský adaptér.

## Distribuce

Aplikace povolí distribuci pouze výsledkům, které prošly validační bránou, mají právě jeden platný e-mail, nemají duplicitní adresu a byly schváleny učitelem. Doporučený režim je nejprve vytvořit Gmail koncepty.

## Odchozí datové toky

AI hodnocení a e-mailová distribuce jsou dva různé odchozí toky a škola je musí posuzovat odděleně:

1. **AI služba:** odchází pseudonymní kód, učitelem zkontrolovaný nebo pseudonymizovaný text, zadání a hodnoticí instrukce. Jméno, e-mail, třída a lokální anonymizační mapa se neposílají. Fotografie nebo PDF mohou obsahovat údaje přímo v obrazu; před jejich odesláním se má odstranit identifikační záhlaví a učitel musí následně potvrdit přepis.
2. **Apps Script a Gmail:** až po učitelském schválení mohou odejít skutečné jméno a e-mail, výsledné hodnocení a zpětná vazba; podle zvoleného nastavení také původní text práce. Přímý režim i kompatibilní formulářový režim předávají stejný obsah témuž školnímu Apps Scriptu. U kompatibilního režimu aplikace výsledek automaticky nepotvrdí, proto je nutná kontrola nové karty a Gmailu před opakováním.
3. **Lokální exporty:** soubory zůstávají na zařízení, dokud je uživatel sám nepřenese nebo neuloží do další služby.

Tato technická dokumentace sama neurčuje právní titul zpracování. Správce školy má oba síťové toky uvést v evidenci zpracování, nastavit příjemce, přístupy, dobu uchování a mazání a ověřit smluvní režim používaných služeb.

## Apps Script

Webovou aplikaci nasazuj pod školním účtem. Sdílené tajemství patří do `Script Properties` pod názvem `SHARED_SECRET`; nevkládej jej do veřejného kódu. Dočasný bridge není rovnocenný serverovému tajemství, protože oprávněný uživatel jej může v prohlížeči zobrazit. Pro oficiální provoz přesuň distribuci i tajemství na backend.
