# Evidence: disabled Generate interaction styles

## Problem

The disabled Generate button still matched the hover and active selectors, so it visually moved even though it could not be used.

## Fix

The hover and active styles now apply only when the button is not disabled.

## Verification

`before.txt` records the unguarded selector. `after.txt` confirms that both interaction selectors exclude disabled buttons.

```bash
node assignment1/evidence/disabled-hover/hover-regression-test.js assignment1/index.html expect-fixed
```
