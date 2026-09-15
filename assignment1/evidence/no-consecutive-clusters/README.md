# Evidence: prevent consecutive recommendations from the same cluster

## Problem

Preventing an identical dish from repeating does not prevent near-repeats. For example, the previous implementation could recommend Ramen followed by Soup because they occupied different menu positions.

## Clusters

Every dish belongs to exactly one of six clusters, and every cluster now contains seven dishes.

## Fix

After each recommendation, the app filters out every dish in the selected dish's cluster. It samples uniformly from the remaining eligible dishes. This prevents both identical repeats and different dishes of the same type from appearing consecutively, without retry loops.

## Verification

`before.txt` records a deterministic `Ramen -> Soup` failure. The current test verifies all 42 cluster assignments and demonstrates zero same-cluster transitions across 100,000 reproducible selections while keeping every dish reachable.

Run the checks from the repository root:

```bash
node assignment1/evidence/no-consecutive-clusters/cluster-regression-test.js assignment1/index.html expect-no-cluster-repeat
node assignment1/evidence/no-consecutive-clusters/cluster-regression-test.js assignment1/index.html stress-no-cluster-repeat
```
