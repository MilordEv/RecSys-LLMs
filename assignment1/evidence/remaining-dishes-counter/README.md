# Evidence: remaining-dishes counter

## Problem

The blacklist count did not tell the user how many choices were still available when the menu became small.

## Fix

When fewer than ten dishes remain, the blacklist status also reports the exact number left. The extra counter stays hidden at ten or more.

## Verification

`before.txt` shows the missing counter at nine and eight remaining dishes. `after.txt` records the exact counts and confirms that clearing restores the normal status.

```bash
node assignment1/evidence/remaining-dishes-counter/counter-regression-test.js assignment1/index.html expect-working
```
