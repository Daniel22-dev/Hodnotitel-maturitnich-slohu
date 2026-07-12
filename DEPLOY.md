# Nasazení Hodnotitele 1.3.6

Doporučený postup je přes GitHub Desktop nebo úplné nahrazení obsahu repozitáře. Pouhé nahrání nových souborů přes webové rozhraní neumí odstranit staré soubory.

1. Zálohujte repozitář.
2. Nahraďte jeho obsah soubory z tohoto balíčku.
3. Odstraňte soubory uvedené v `FILES-TO-DELETE-1.3.6.txt`, pokud v repozitáři zůstaly z dřívější verze.
4. Commitněte a odešlete změny.
5. V GitHub Actions ověřte zelený běh **Test and deploy Hodnotitel**.
6. Po nasazení otestujte běžné otevření, anonymní okno, instalovanou PWA a nouzový offline režim.

Složka `dist/` je reprodukovatelný výstup buildu. Workflow ji při každém nasazení znovu vytvoří; ručně ji neupravujte.
