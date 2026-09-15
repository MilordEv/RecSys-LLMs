# Evidence: session dish blacklist

## Problem

The original application had no way to exclude a recommendation that a user cannot or does not want to eat.

## Improvement

The currently displayed recommendation now has a `Blacklist this dish` action. Blacklisting immediately replaces that dish and excludes it from every later recommendation in the current page session. A visible count reports the number of exclusions, and `Clear blacklist` restores all excluded dishes.

The selection logic prioritizes the blacklist over the cluster and three-recommendation cooldown rules if the available catalogue becomes very small. If every dish is excluded, the app displays `No dishes available` instead of failing.

## Verification

`before.txt` proves the original control was absent. The current test records 10,000 selections in which the blacklisted dish appears zero times while all other 41 dishes remain reachable. It also verifies the safe empty state after excluding all 42 dishes and recovery after clearing.

Run the test from the repository root:

```bash
node assignment1/evidence/dish-blacklist/blacklist-regression-test.js assignment1/index.html expect-working
```
