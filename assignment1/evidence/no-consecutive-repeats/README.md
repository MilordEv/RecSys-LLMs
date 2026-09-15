# Evidence: prevent consecutive dish repeats

## Problem

The original selection logic independently sampled all 12 menu entries on every selection. That gave the dish just shown a 1-in-12 chance of appearing again immediately.

## Reproduction

`before.txt` records a deterministic reproduction against the original page script: random inputs `0.01, 0.01` displayed `Pizza -> Pizza`.

## Fix

After the first selection, the application now samples uniformly from the 11 entries other than the dish shown last. The mapping does not retry random values, so it remains deterministic and cannot loop indefinitely.

## Verification

`after.txt` records two checks against the fixed page script:

1. The original deterministic reproduction now displays `Pizza -> Sushi`.
2. A reproducible run of 100,000 selections produces zero consecutive repeats while selecting every menu item.
3. A browser interaction check of 20 visible selections produces zero adjacent repeats and no console errors.

Run the checks from the repository root:

```bash
node assignment1/evidence/no-consecutive-repeats/regression-test.js assignment1/index.html expect-no-repeat
node assignment1/evidence/no-consecutive-repeats/regression-test.js assignment1/index.html stress-no-repeat
```
