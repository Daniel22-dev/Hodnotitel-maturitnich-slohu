# Audit a opravy — Hodnotitel maturitních slohů 1.3.2

## Zadání opravy

Verze 1.3.0 byla znovu otevřena kvůli třem konkrétním problémům z reálného mobilního použití:

1. školní logo bylo téměř neviditelné;
2. dvě části hlavního názvu používaly odlišnou barvu;
3. seznam e-mailů exportovaný z IS na jednom řádku byl načten jako jeden student.

Současně byla požadována nová profesionální ikona aplikace.

## Provedené opravy

### Import z IS

Původní parser procházel vstup po řádcích a z každého řádku načetl pouze první nalezený e-mail. Proto celý čárkový seznam vytvořil jediný záznam.

Nový parser:

- rozpozná více e-mailů na jednom řádku;
- podporuje čárku, středník, tabulátor, svislítko i nový řádek;
- podporuje formát `jméno; e-mail`;
- odstraní duplicity;
- odvodí čitelné jméno z lokální části e-mailu;
- respektuje limit 20 studentů;
- zobrazuje živý počet rozpoznaných studentů;
- upozorní na fragmenty s neplatným e-mailem.

### Školní logo

Zdrojové PNG obsahovalo správný tvar loga, ale jeho neprůhlednost byla přibližně jen deset procent běžné hodnoty. Logo proto na mobilu působilo jako světlý placeholder. Tvar nebyl měněn; byla obnovena kontrastní černobílá verze a zachováno průhledné okolí.

### Název aplikace

Kurzíva u slov „maturitních slohů“ zůstává zachována, ale barva se nyní dědí z celého titulku. Zlatá je ponechána pouze pro menší akcenty rozhraní.

### Nová ikona

Nová PWA ikona používá:

- tmavé navy pozadí;
- zlatý rámeček;
- vycentrovaný štít;
- hrot pera;
- potvrzovací značku.

Motiv má bezpečný vnitřní prostor pro maskable ořez a je dodán ve velikostech 192 × 192 a 512 × 512 i jako zdrojové SVG.

## Ochrana údajů

Konkrétní seznam studentů posloužil pouze k reprodukci chyby. V repozitáři a automatických testech byl nahrazen syntetickými adresami `student01@example.edu` až `student16@example.edu`.

## Ověření

- 348 automatických kontrol prošlo;
- 0 kontrol selhalo;
- produkční build proběhl bez chyby;
- funkční test ověřuje 16 samostatných položek z jednoho čárkového řádku;
- výsledný ZIP neobsahuje reálné studentské adresy.

## Verdikt

Verze 1.3.2 opravuje nahlášenou funkční regresi a sjednocuje viditelný branding. Balík je připraven k nahrání do kořene existujícího GitHub repozitáře.
