# Doporučený pracovní postup učitele

## 1. Založ sérii

Vyplň název, skupinu, datum a učitele. Vyber přesné zadání. Aplikace k sérii uloží verzi rubriky, takže pozdější aktualizace pravidel nezmění historický kontext.

## 2. Načti studenty

Zkopíruj skupinu z IS do pole „Seznam studentů“. Ideální je jeden student na řádek:

```text
Jan Novák; jan.novak@example.edu
Eva Malá; eva.mala@example.edu
```

Podporovány jsou také tabulátory, čárky a řádky obsahující e-mail.

## 3. Nahraj práce

- digitální práce lze vybrat hromadně;
- pro celou skupinu je nejrychlejší ZIP;
- DOCX se čte lokálně i bez internetu;
- vícestránkové práce pojmenuj společným základem, například `Novak_Jan_1.jpg`, `Novak_Jan_2.jpg`;
- maximální série je 20 prací.

## 4. Zkontroluj párování

Aplikace nabídne studenta podle názvu souboru. U každé práce ověř jméno a e-mail. Skutečná identita slouží pouze k lokálnímu párování a rozeslání; AI dostane studentský kód.

## 5. Potvrď přepisy

U PDF a fotografií spusť přepis, porovnej jej s originálem, oprav nejasná místa a klikni na „Potvrdit přepis učitelem“. Bez tohoto kroku se série nespustí.

## 6. Vyber provoz

- **Vyhodnotit nyní:** práce se hodnotí postupně a výsledky se objevují průběžně.
- **Úsporné Batch API:** vhodné, když výsledek nemusí být okamžitý. Po odeslání použij „Zkontrolovat Batch úlohu“.

Před spuštěním zkontroluj odhad tokenů a ceny.

## 7. Proveď finální kontrolu učitele

U každé práce ověř:

- body v osmi kategoriích a celkovou známku;
- výsledek validační brány;
- počet slov, splnění zadání a FAIL podmínky;
- citace a konkrétní jazykové chyby;
- správnost jména, kódu a e-mailu.

Ruční korekci ulož v panelu „Finální kontrola učitele“ a teprve poté výsledek označ jako zkontrolovaný.

## 8. Připrav report

V Report Studiu zvol:

- formální školní nebo přívětivý studentský vzhled;
- obrazovkový nebo A4 náhled;
- volitelný podpis;
- bodovou mapu, tři priority a revizní miniúkol.

Kontrola souladu upozorní na zjevné rozpory mezi slovním komentářem, body a známkou. Upozornění neřeš automaticky; vždy ověř původní text a rubriku.

Komentářová banka umožní vložit opakovaně používanou větu do poznámky učitele. Vlastní komentáře a podpis se bez zapnutého citlivého ukládání po zavření aplikace neuchovají.

## 9. Použij analytiku nebo historii

- anonymní třídní analytika pracuje pouze se schválenými validními výsledky;
- pseudonymní historii používej jen na vlastním zařízení a pouze tehdy, když škola akceptuje účel a dobu uchování;
- jednotlivý výsledek lze uložit do historie až po finální kontrole učitelem;
- pro trend musí mít student dlouhodobě stejný pseudonymní kód.

## 10. Exportuj a rozešli zpětnou vazbu

Doporučený postup:

1. otevřít studentskou podobu reportu;
2. namátkově zkontrolovat A4/PDF a DOCX;
3. schválit validní výsledky;
4. vytvořit Gmail koncepty;
5. v Gmailu ověřit příjemce a obsah;
6. koncepty odeslat.

Přímé hromadné odeslání používej až po ověření Apps Script integrace na vlastním testovacím e-mailu.
