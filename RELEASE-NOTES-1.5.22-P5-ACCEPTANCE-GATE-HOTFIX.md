# Hodnotitel maturitních slohů 1.5.22 – P5 acceptance gate consistency hotfix

Datum: 2026-09-05

## Důvod

Skutečný GitHub Actions běh kandidáta 1.5.21 již potvrdil čistý browser runtime i accessibility:

- `initFailures: 0`;
- `qaErrors: 0`;
- `blockers: 0`;
- axe `critical: 0`, `serious: 0`, `moderate: 0`, `minor: 0`;
- P5 release report `51/51 PASS`.

Přesto workflow končil chybou `acceptance.github-pending`. Příčinou nebyl runtime aplikace, ale nekonzistence mezi novou ecosystem-wave release policy a starším P5-R2 acceptance skriptem. Skript vyžadoval pouze legacy hodnotu `github.status: not-yet-uploaded`, zatímco kandidát správně deklaroval `post-fix-ci-validation-required`.

## Oprava

- `scripts/qa-p5-acceptance.mjs` rozlišuje `ecosystem-wave-candidate` od legacy pre-upload režimu;
- pro wave kandidáta acceptance vyžaduje `currentUseApproved: false`;
- vyžaduje `github.status: post-fix-ci-validation-required` a `postUploadValidationRequired: true`;
- vyžaduje shodu wave Platform verze s consumer manifestem;
- vyžaduje `sharedDeviceCleanupGreen: false`, `e01Closed: false` a `syntheticDataOnlyUntilWaveComplete: true`;
- legacy větev `not-yet-uploaded` zůstává zachována pro ne-wave P5 kandidáty;
- přidány regresní testy, které blokují návrat bezpodmínečného `acceptance.github-pending` checku.

## Co se nemění

- GHRAB Platform zůstává 1.1.2;
- vendor Platform soubory se nemění;
- suite-session cleanup, PC-01 a acknowledgement se nemění;
- runtime bootstrap se nemění;
- accessibility fix z 1.5.20 se nemění;
- E-01, F-02 a F-03 nejsou tímto hotfixem ekosystémově uzavřeny.

## Release policy

1.5.22 je stále pouze **AMBER ecosystem-wave candidate**. Úspěšný P5 acceptance gate znamená pouze konzistentní lokální/CI důkaz této child aplikace; neznamená produkční GREEN celého ekosystému. Do dokončení release wave používat pouze syntetická data.
