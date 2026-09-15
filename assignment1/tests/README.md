# Assignment 1 regression tests

Run the complete suite from the repository root:

```bash
node assignment1/tests/run-all-tests.js
```

The suite executes the actual inline JavaScript from `assignment1/index.html` in a deterministic DOM harness. It verifies:

- a dish is absent from the next three recommendations;
- the dish becomes eligible again after exactly three other recommendations;
- adjacent recommendations never share a cluster;
- all 42 unique dishes remain reachable;
- all six recommendation clusters contain exactly seven dishes;
- every configured Font Awesome icon exists, including the corrected Ramen, Pasta, and Soup icons;
- blacklisted dishes remain excluded while all alternatives stay reachable;
- clearing the blacklist makes excluded dishes eligible again;
- excluding all dishes produces a safe empty state and clearing recovers it;
- the number of available dishes appears when fewer than ten remain;
- disabled generation controls do not animate on hover or click;
- all behavioral guarantees hold across reproducible runs of 100,000 selections.

The icon tests require network access because they read the exact pinned Font Awesome 6.4.0 stylesheet used by the application.
