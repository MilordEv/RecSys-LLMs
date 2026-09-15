const fs = require('node:fs');

const [htmlPath, expectation] = process.argv.slice(2);

if (!htmlPath || !['expect-baseline', 'expect-expanded'].includes(expectation)) {
    console.error('Usage: node menu-regression-test.js <index.html> <expect-baseline|expect-expanded>');
    process.exit(2);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const entries = [...html.matchAll(/\{ name: "([^"]+)", icon: "fas fa-([^"]+)"(?:, cluster: "[^"]+")? \}/g)]
    .map(([, name, icon]) => ({ name, icon }));
const uniqueNames = new Set(entries.map(({ name }) => name));

console.log(`Menu entries: ${entries.length}`);
console.log(`Unique dish names: ${uniqueNames.size}`);
console.log(`Dishes: ${entries.map(({ name }) => name).join(', ')}`);

if (expectation === 'expect-baseline') {
    if (entries.length !== 12 || uniqueNames.size !== 12) {
        console.error('FAIL: expected the 12-dish baseline');
        process.exit(1);
    }
    console.log('PASS');
    process.exit(0);
}

async function verifyExpandedMenu() {
    const stylesheetUrl = html.match(/<link rel="stylesheet" href="([^"]*font-awesome[^"]*)">/)?.[1];
    if (!stylesheetUrl) {
        throw new Error('Font Awesome stylesheet URL not found');
    }

    const response = await fetch(stylesheetUrl);
    if (!response.ok) {
        throw new Error(`Stylesheet request failed with HTTP ${response.status}`);
    }

    const stylesheet = await response.text();
    const missingIcons = entries
        .filter(({ icon }) => !stylesheet.includes(`.fa-${icon}:before`))
        .map(({ name, icon }) => `${name} (fa-${icon})`);

    console.log(`Missing icon classes: ${missingIcons.length}`);
    if (missingIcons.length > 0) {
        console.log(`Missing icons: ${missingIcons.join(', ')}`);
    }

    if (entries.length !== 42 || uniqueNames.size !== 42 || missingIcons.length !== 0) {
        console.error('FAIL: expected 42 unique dishes with valid icon classes');
        process.exit(1);
    }

    console.log('PASS');
}

verifyExpandedMenu().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
