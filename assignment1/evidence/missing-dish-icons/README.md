# Evidence: missing dish icons

## Problem

Ramen, Pasta, and Soup were configured with `fa-bowl-hot`, `fa-pasta`, and `fa-bowl`. None of those class names exists in the Font Awesome 6.4.0 stylesheet loaded by the application, so the browser could not render their glyphs.

## Fix

- Ramen: `fa-bowl-hot` → `fa-bowl-food`
- Pasta: `fa-pasta` → `fa-plate-wheat`
- Soup: `fa-bowl` → `fa-mug-hot`

The replacements are available in the same pinned Font Awesome Free stylesheet, so no dependency change was needed.

## Verification

`before.txt` records all three original classes as missing. `after.txt` records that all replacement classes are present and that each produces a non-empty, 64px-wide glyph in the browser with no console errors.

Run the stylesheet check from the repository root with network access:

```bash
node assignment1/evidence/missing-dish-icons/icon-regression-test.js assignment1/index.html expect-present
```
