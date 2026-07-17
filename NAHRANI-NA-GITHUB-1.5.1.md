# Nahrání Hodnotitele 1.5.1 na GitHub

Použijte finální GitHub ZIP z certifikačního balíku. Jeho obsah nahrajte do kořene repozitáře tak, aby se nahradily stejnojmenné soubory a odstranily staré soubory uvedené v `FILES-TO-DELETE-1.5.0.txt`.

Doporučený commit: `fix(hodnotitel): merge audit fixes and certify 1.5.1`.

Po nahrání musí GitHub Actions dokončit `npm run qa:release`. Teprve potom otevřete nasazenou adresu a proveďte smoke test uvedený ve společném návodu.
