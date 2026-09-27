# Hodnotitel 1.5.30 — sjednocená sekce O aplikaci

- Horní lišta nově nabízí **O aplikaci** místo samostatného Deníku změn.
- Karta přebírá společný informační vzor ekosystému: identita, autor/vývojový garant, školní projekt, přístup a určení, technický stav a provozní zásady.
- Technický blok pravdivě uvádí PWA, GHRAB Platform 1.1.2, AI Core 1.0.0, GARP 2.7 r2 / G-02 a nepřipojený školní server s LIVE stavem NOT_TESTED.
- Posledních deset vydání je dostupných ve sbaleném Katalogu změn uvnitř karty.
- Hodnoticí logika, rubrika, scoring, AI operace, pseudonymizace, ukládání studentských dat a exporty zůstávají beze změny.
- Performance budget `distBytes` byl po kontrole výchozího stavu zvýšen z 1 170 000 B na 1 180 000 B: verze 1.5.29 měla jen 70 B rezervy, zatímco 1.5.30 přidává přibližně 8,2 kB skutečného UI. Ostatní performance limity se nemění.
