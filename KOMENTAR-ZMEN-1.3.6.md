# Hodnotitel maturitních slohů 1.3.6 – reakce na hloubkový audit

## Provedeno

- **Logo a identita:** čtyři duplicitní bitmapy byly nahrazeny jediným kanonickým souborem `assets/ghrab-logo.png`. CSS nyní obsahuje jedinou záměrnou variantu bílé dlaždice; odstraněna byla mrtvá pravidla s inverzí.
- **Přístupová brána:** vzhled brány je lokální. Vzdálený modul zůstává autoritou, když je dostupný. Načtení a ověření mají časový limit. Při nedostupnosti portálu nebo skutečném offline stavu se aplikace otevře s nepřehlédnutelným varováním; explicitní zamítnutí oprávnění se neobchází.
- **PWA:** `manifest.webmanifest`, `id` i `start_url` jsou stabilní. Čerstvost řídí pouze verze cache service workeru.
- **Service worker:** HTML fallback se používá jen pro navigaci. Chybějící skript, obrázek nebo JSON už nedostane falešně `index.html`.
- **Dávkový snapshot:** base64 přílohy se neukládají. Ukládání je odložené o 550 ms, výsledek zápisu se kontroluje a případná chyba je viditelná. Po obnovení je jasně uvedeno, že obrázky/PDF je nutné přiložit znovu.
- **Prompt:** odstraněny chatové artefakty, duplicitní věty, instrukce k ruční anotaci dokumentu i výpočtu známky. Prompt je čistě analytický; bodování zůstává lokální a deterministické.
- **Verze:** jediným zdrojem je `package.json`; build ji vkládá do aplikace, service workeru, UI, manifestu AI Studia a hlavičky backendu.
- **Anonymizace:** zadaná identita se nahrazuje jako celý řetězec i po jednotlivých tokenech dlouhých alespoň tři znaky. Skloňované tvary a přezdívky zůstávají vědomým limitem a jsou popsány v privacy intru. Prosté devítimístné sekvence se už automaticky nemažou jako telefon; vyžadují kontrolu.
- **Repozitář:** odstraněny staré manifesty, duplicitní loga a ikony i dvojí návod k nahrání. Přidán `DEPLOY.md` a seznam souborů, které je nutné z historického repozitáře smazat.

## Záměrně neprovedeno

- **Plné lokální zabalení kryptografického guardu:** jeho zdroj a přesný protokol nejsou součástí dodaného balíčku. Rekonstrukce naslepo by mohla změnit bezpečnostní semantiku. Verze 1.3.6 proto řeší dostupnost bezpečným kompromisem: lokální vzhled, timeout, nouzový offline režim a žádné obejití explicitního zamítnutí.
- **Nonce/timestamp a denní kvóta Apps Scriptu:** jde o změnu protokolu klient–skript, kterou je vhodné zavést v samostatné verzi s migračním testem, aby se nerozbily existující koncepty a retry mechanismus.
- **Vyřazení `dist/` z balíčku:** workflow jej umí reprodukovat, ale ponechání výstupu je praktičtější pro současný způsob nahrávání přes GitHub. Zdroj pravdy zůstává `src/`; `dist/` se nesmí ručně editovat.
