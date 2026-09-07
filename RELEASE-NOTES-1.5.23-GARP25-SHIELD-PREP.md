# Hodnotitel maturitních slohů 1.5.23 — GARP 2.5.1 SHIELD-PREP

Datum: 2026-09-07

Tato verze je delta migrací současného kandidáta 1.5.22 na GARP 2.5.1 R2. Nejde o produkční GREEN ani o povolení reálných studentských dat.

## Hlavní bezpečnostní změna

GARP R2 před opravou prokázal GH-02 FAIL: Service Worker precachoval autorizační a deployment soubory a spustitelný `ghrab-platform.js`. Verze 1.5.23 zavádí explicitní `isSecurityCriticalRequest -> networkOnlyNoStore` hranici před všemi cache-first cestami, vyjímá security-critical assety z aplikačního i platformního precache a používá autoritativní seznam `security/garp251/security-critical-assets.json`.

Pre-fix FAIL byl zachycen před opravou; post-fix R2 checker je vyžadován pro public i school-server build. GHNC-02 navíc záměrně vloží `release-integrity.json` do precache disposable kopie a vyžaduje blokující FAIL.

## Integrace do release QA

`npm run qa:garp25` je součástí `qa:p5` i `qa:p5:ci`. Kontroluje vendored GARP 2.5.1 R2 tooling, SW security freeze, deployment leak scan, school-server fail-closed profil a negative controls.

Repository secret scan má jedinou hashově připnutou výjimku pro byte-identický upstream `selftest-garp251.mjs`, protože tento oficiální selftest záměrně obsahuje syntetické secret sentinely. Jakákoli změna jeho obsahu zruší výjimku.

## Stav

- SHIELD-PREP: kandidát k nezávislé delta kontrole.
- School-server LIVE: NOT TESTED.
- Automatický SCA přes `npm audit`: NOT TESTED v tomto prostředí kvůli nedostupnému npm audit endpointu; lockfile audit je samostatně proveden.
- Behaviorální live-model AI-RED: NOT TESTED.
- Reálná studentská data: NEPOUŽÍVAT.
