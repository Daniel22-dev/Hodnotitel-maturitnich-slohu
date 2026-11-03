# Gmail Apps Script – distribuce zpětné vazby

1. Vytvoř nový Apps Script pod školním Google Workspace účtem.
2. Vlož obsah `Code.gs`.
3. V **Project Settings → Script Properties** vytvoř `SHARED_SECRET` a zadej dlouhé náhodné tajemství.
4. Nasadit jako **Web app**: spouštět jako vlastník, přístup jen uživatelé školní domény nebo dle politiky školy.
5. URL `/exec` a stejné tajemství vlož do Hodnotitele.
6. Nejprve používej režim **Vytvořit koncepty** a zkontroluj několik zpráv v Gmailu.

Skript přijme maximálně 20 schválených položek, kontroluje e-maily, duplicity a sdílené tajemství. Identitu a zpětnou vazbu odesílej pouze ze školního účtu a pomocné exporty nesdílej veřejně.


## Kompatibilní režim

Přímý `fetch` z GitHub Pages může být v některých školních nastaveních zablokován přihlášením Google nebo pravidly prohlížeče. Hodnotitel proto obsahuje i tlačítko **Kompatibilní odeslání v nové kartě**. To předá stejný JSON jako formulářový POST a odpověď Apps Scriptu zobrazí v nové kartě.

Důležité: při chybě přímého propojení nejprve zkontroluj Gmail. Síťová chyba může nastat až po zpracování požadavku. Kompatibilní režim nespouštěj bez kontroly, jinak by mohly vzniknout duplicitní koncepty nebo e-maily.

## 1.2: At-most-once idempotence, stále pouze předprodukční

Novou verzi `Code.gs` je nutné samostatně nasadit do školního Apps Scriptu;
změna na GitHubu nemění dosavadní web app deployment. Každý odesílací
požadavek má kryptografické `requestId`. Server používá `LockService`,
rezervuje celé dávky do `PropertiesService` před voláním Gmailu
a eviduje pouze HMAC digesty + technické stavy, ne zprávy či e-maily.
Opakované ID nebo stejný student ve stejné sérii (včetně změny draft/send)
je bezpečně odmítnuto. Neúspěšný i částečný pokus se nesmí automaticky
opakovat: nejprve se ve školním Gmailu zkontroluje doručení/koncepty.
Pokud je skutečně třeba opakovat doručení, učitel musí vytvořit novou
explicitně schválenou sérii. Rezervace se samy nemažou, jejich retence
a kapacita Script Properties musí mít školní provozní pravidla.

**At-most-once není záruka doručení.** Sdílené tajemství uložené v
prohlížeči nenahrazuje skutečné školní přihlášení ani oprávnění.
Do konce školního UAT/SSO a GDPR rozhodnutí zůstává ostré odesílání NO-GO.
