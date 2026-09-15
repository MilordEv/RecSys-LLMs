const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..');
const appPath = path.join(repositoryRoot, 'assignment1', 'index.html');

const tests = [
    {
        name: 'Dish cannot repeat within the next three recommendations',
        script: 'assignment1/evidence/three-recommendation-cooldown/cooldown-regression-test.js',
        expectation: 'expect-no-early-repeat'
    },
    {
        name: 'Dish becomes eligible after exactly three other recommendations',
        script: 'assignment1/evidence/three-recommendation-cooldown/cooldown-regression-test.js',
        expectation: 'expect-return-after-cooldown'
    },
    {
        name: 'Dish cooldown holds across 100,000 selections',
        script: 'assignment1/evidence/three-recommendation-cooldown/cooldown-regression-test.js',
        expectation: 'stress-no-early-repeat'
    },
    {
        name: 'Consecutive recommendations use different clusters',
        script: 'assignment1/evidence/no-consecutive-clusters/cluster-regression-test.js',
        expectation: 'expect-no-cluster-repeat'
    },
    {
        name: 'Cluster exclusion holds across 100,000 selections',
        script: 'assignment1/evidence/no-consecutive-clusters/cluster-regression-test.js',
        expectation: 'stress-no-cluster-repeat'
    },
    {
        name: 'Identical dishes never appear consecutively',
        script: 'assignment1/evidence/no-consecutive-repeats/regression-test.js',
        expectation: 'expect-no-repeat'
    },
    {
        name: 'Identical-dish exclusion holds across 100,000 selections',
        script: 'assignment1/evidence/no-consecutive-repeats/regression-test.js',
        expectation: 'stress-no-repeat'
    },
    {
        name: 'Menu contains 42 unique dishes with valid icons',
        script: 'assignment1/evidence/menu-expansion/menu-regression-test.js',
        expectation: 'expect-expanded'
    },
    {
        name: 'Ramen, Pasta, and Soup icons exist',
        script: 'assignment1/evidence/missing-dish-icons/icon-regression-test.js',
        expectation: 'expect-present'
    },
    {
        name: 'Blacklisted dishes stay excluded and clearing restores them',
        script: 'assignment1/evidence/dish-blacklist/blacklist-regression-test.js',
        expectation: 'expect-working'
    },
    {
        name: 'Every recommendation cluster contains seven dishes',
        script: 'assignment1/evidence/balanced-clusters/cluster-balance-test.js',
        expectation: 'expect-balanced'
    },
    {
        name: 'Remaining dish count appears below ten',
        script: 'assignment1/evidence/remaining-dishes-counter/counter-regression-test.js',
        expectation: 'expect-working'
    },
    {
        name: 'Disabled Generate button has no hover or active animation',
        script: 'assignment1/evidence/disabled-hover/hover-regression-test.js',
        expectation: 'expect-fixed'
    }
];

let failures = 0;

for (const [index, test] of tests.entries()) {
    console.log(`\n[${index + 1}/${tests.length}] ${test.name}`);
    const result = spawnSync(
        process.execPath,
        [path.join(repositoryRoot, test.script), appPath, test.expectation],
        { cwd: repositoryRoot, encoding: 'utf8' }
    );

    if (result.stdout.trim()) {
        console.log(result.stdout.trim());
    }
    if (result.stderr.trim()) {
        console.error(result.stderr.trim());
    }

    if (result.status !== 0) {
        failures += 1;
        console.error(`RESULT: FAIL (exit ${result.status})`);
    } else {
        console.log('RESULT: PASS');
    }
}

console.log(`\nSummary: ${tests.length - failures}/${tests.length} tests passed`);
process.exit(failures === 0 ? 0 : 1);
