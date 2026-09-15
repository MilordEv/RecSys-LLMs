# Evidence: expand the dish catalogue

## Problem

The lunch generator originally offered only 12 distinct dishes. This limited the variety of recommendations even across longer sessions.

## Improvement

The first expansion brought the catalogue to 24 dishes. A later balancing pass added 18 more dishes, bringing the final catalogue to 42 unique dishes across six equal clusters.

- Hot Dog
- Fried Rice
- Falafel Wrap
- Grilled Chicken
- Seafood Bowl
- Cheese Toastie
- Omelette
- Veggie Stir-fry
- Chili
- Fish & Chips
- Avocado Toast
- Pho

## Verification

`before.txt` records the original 12 unique entries. The current regression test proves that the final catalogue has 42 unique names, all icon classes exist in the pinned Font Awesome stylesheet, every dish appears in a reproducible 100,000-selection run, and zero consecutive repeats occur.

Run the checks from the repository root:

```bash
node assignment1/evidence/menu-expansion/menu-regression-test.js assignment1/index.html expect-expanded
node assignment1/evidence/no-consecutive-repeats/regression-test.js assignment1/index.html stress-no-repeat
```

The first command requires network access because it validates the icons against the same pinned stylesheet used by the app.
