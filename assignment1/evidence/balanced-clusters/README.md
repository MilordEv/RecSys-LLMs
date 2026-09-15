# Evidence: balanced recommendation clusters

## Problem

The six clusters contained between two and seven dishes, so filtering by the previous cluster changed the selection probability of individual dishes.

## Fix

The menu was expanded from 24 to 42 unique dishes. Every cluster now contains exactly seven dishes.

## Verification

`before.txt` records the unequal cluster sizes. `after.txt` proves that all six clusters contain seven unique dishes.

```bash
node assignment1/evidence/balanced-clusters/cluster-balance-test.js assignment1/index.html expect-balanced
```
