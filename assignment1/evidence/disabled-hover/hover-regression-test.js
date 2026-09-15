const fs = require('node:fs');

const [htmlPath, expectation] = process.argv.slice(2);
if (!htmlPath || !['expect-bug', 'expect-fixed'].includes(expectation)) {
    console.error('Usage: node hover-regression-test.js <index.html> <expect-bug|expect-fixed>');
    process.exit(2);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const unguardedHover = /\.generate-btn:hover\s*\{/.test(html);
const guardedHover = /\.generate-btn:hover:not\(:disabled\)\s*\{/.test(html);
const guardedActive = /\.generate-btn:active:not\(:disabled\)\s*\{/.test(html);

console.log(`Unguarded hover selector present: ${unguardedHover}`);
console.log(`Disabled-safe hover selector present: ${guardedHover}`);
console.log(`Disabled-safe active selector present: ${guardedActive}`);

const fixed = !unguardedHover && guardedHover && guardedActive;
const expectedFixed = expectation === 'expect-fixed';
if (fixed !== expectedFixed) {
    console.error(`FAIL: expected disabled-safe interaction styles = ${expectedFixed}`);
    process.exit(1);
}
console.log('PASS');
