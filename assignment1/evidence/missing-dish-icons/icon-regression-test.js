const fs = require('node:fs');

const [htmlPath, expectation] = process.argv.slice(2);

if (!htmlPath || !['expect-missing', 'expect-present'].includes(expectation)) {
    console.error('Usage: node icon-regression-test.js <index.html> <expect-missing|expect-present>');
    process.exit(2);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const stylesheetUrl = html.match(/<link rel="stylesheet" href="([^"]*font-awesome[^"]*)">/)?.[1];

if (!stylesheetUrl) {
    throw new Error('Font Awesome stylesheet URL not found');
}

const targetDishes = new Set(['Pasta', 'Soup', 'Ramen']);
const menuEntries = [...html.matchAll(/\{ name: "([^"]+)", icon: "fas fa-([^"]+)"(?:, cluster: "[^"]+")? \}/g)]
    .map(([, dish, icon]) => ({ dish, icon }))
    .filter(({ dish }) => targetDishes.has(dish));

if (menuEntries.length !== targetDishes.size) {
    throw new Error('Could not find all target dishes in the lunch menu');
}

async function run() {
    const response = await fetch(stylesheetUrl);
    if (!response.ok) {
        throw new Error(`Stylesheet request failed with HTTP ${response.status}`);
    }

    const stylesheet = await response.text();
    const results = menuEntries.map(({ dish, icon }) => ({
        dish,
        icon,
        exists: stylesheet.includes(`.fa-${icon}:before`)
    }));
    const missingCount = results.filter(({ exists }) => !exists).length;

    console.log(`Font Awesome stylesheet: ${stylesheetUrl}`);
    for (const { dish, icon, exists } of results) {
        console.log(`${dish}: fa-${icon} -> ${exists ? 'PRESENT' : 'MISSING'}`);
    }
    console.log(`Missing target icons: ${missingCount}`);

    const passes = expectation === 'expect-missing' ? missingCount === 3 : missingCount === 0;
    if (!passes) {
        console.error(`FAIL: expectation was ${expectation}`);
        process.exit(1);
    }

    console.log('PASS');
}

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
