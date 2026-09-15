# Evidence: three-recommendation dish cooldown

## Problem

The cluster restriction prevents immediate near-duplicates, but it still allowed a dish to return after only one intervening recommendation. The deterministic baseline demonstrates `Pizza -> Sushi -> Pizza`.

## Fix

The app now keeps a rolling history of the last three recommended dish names. Candidate dishes must satisfy both conditions:

1. They are not in the immediately previous dish's cluster.
2. They have not appeared in the last three recommendations.

A dish becomes eligible again only after three other recommendations have been shown.

## Verification

`before.txt` records the deterministic early repeat. The current tests prove the dish becomes eligible again after exactly three other recommendations and include a reproducible 100,000-selection test with zero cooldown violations. All 42 dishes remained reachable, and the existing same-cluster restriction also produced zero violations.

Run the checks from the repository root:

```bash
node assignment1/evidence/three-recommendation-cooldown/cooldown-regression-test.js assignment1/index.html expect-no-early-repeat
node assignment1/evidence/three-recommendation-cooldown/cooldown-regression-test.js assignment1/index.html expect-return-after-cooldown
node assignment1/evidence/three-recommendation-cooldown/cooldown-regression-test.js assignment1/index.html stress-no-early-repeat
node assignment1/evidence/no-consecutive-clusters/cluster-regression-test.js assignment1/index.html stress-no-cluster-repeat
```
