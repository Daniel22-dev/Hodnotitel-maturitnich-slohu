# Lokální knihovny

- `jszip.min.js` — JSZip 3.10.1, používá se pro ZIP/DOCX/XLSX exporty a lokální čtení DOCX.
- `JSZIP-LICENSE.md` — text licence MIT dodaný s knihovnou.

Aplikace již pro zpracování DOCX ani exporty nepotřebuje externí CDN. Text z DOCX čte přímo z `word/document.xml`; dokumenty s běžnými odstavci, tabulkami, zalomeními a tabulátory jsou podporovány.
