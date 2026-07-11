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
