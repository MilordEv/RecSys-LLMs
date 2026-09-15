const fs = require('node:fs');

const [htmlPath, expectation] = process.argv.slice(2);
if (!htmlPath || !['expect-unequal', 'expect-balanced'].includes(expectation)) {
    console.error('Usage: node cluster-balance-test.js <index.html> <expect-unequal|expect-balanced>');
    process.exit(2);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const dishes = [...html.matchAll(
    /\{ name: "([^"]+)", icon: "fas fa-[^"]+", cluster: "([^"]+)" \}/g
)].map(([, name, cluster]) => ({ name, cluster }));
const counts = dishes.reduce((result, { cluster }) => {
    result[cluster] = (result[cluster] ?? 0) + 1;
    return result;
}, {});
const sizes = Object.values(counts);
const balanced = sizes.length > 0 && new Set(sizes).size === 1;
const uniqueNames = new Set(dishes.map(({ name }) => name)).size;

console.log(`Dishes found: ${dishes.length}`);
console.log(`Unique dish names: ${uniqueNames}`);
console.log(`Cluster sizes: ${Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([cluster, size]) => `${cluster}=${size}`)
    .join(', ')}`);
console.log(`All clusters equal: ${balanced}`);

const expectedBalanced = expectation === 'expect-balanced';
const validFinalShape = !expectedBalanced || (
    dishes.length === 42 && uniqueNames === 42 && sizes.length === 6 && sizes.every((size) => size === 7)
);
if (balanced !== expectedBalanced || uniqueNames !== dishes.length || !validFinalShape) {
    console.error('FAIL: cluster balance does not match the expected state');
    process.exit(1);
}
console.log('PASS');
