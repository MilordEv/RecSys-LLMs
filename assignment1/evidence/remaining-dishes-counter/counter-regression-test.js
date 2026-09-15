const fs = require('node:fs');
const vm = require('node:vm');

const [htmlPath, expectation] = process.argv.slice(2);
if (!htmlPath || !['expect-missing', 'expect-working'].includes(expectation)) {
    console.error('Usage: node counter-regression-test.js <index.html> <expect-missing|expect-working>');
    process.exit(2);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const menuSize = [...html.matchAll(/\{ name: "[^"]+", icon: "fas fa-[^"]+", cluster: "[^"]+" \}/g)].length;
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const listeners = {};
const button = (name) => ({
    disabled: false,
    hidden: false,
    addEventListener(event, callback) { listeners[`${name}:${event}`] = callback; }
});
const elements = {
    generateBtn: button('generate'),
    blacklistBtn: button('blacklist'),
    clearBlacklistBtn: button('clear'),
    blacklistStatus: { textContent: '' },
    foodIcon: { innerHTML: '' },
    foodName: { textContent: '' },
    lunchDisplay: { classList: { add() {}, remove() {} } }
};
let seed = 314159265;
const deterministicMath = Object.create(Math);
deterministicMath.random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
};

vm.runInNewContext(scripts.at(-1)[1], {
    document: {
        addEventListener(event, callback) { if (event === 'DOMContentLoaded') callback(); },
        getElementById(id) { return elements[id] ?? null; },
        querySelector(selector) {
            return {
                '.food-icon': elements.foodIcon,
                '.food-name': elements.foodName,
                '.lunch-display': elements.lunchDisplay
            }[selector];
        }
    },
    Math: deterministicMath,
    setTimeout(callback) { callback(); }
});

while (menuSize - Number(elements.blacklistStatus.textContent.match(/^\d+/)?.[0] ?? 0) > 10) {
    listeners['blacklist:click']();
}
const tenLeftStatus = elements.blacklistStatus.textContent;
listeners['blacklist:click']();
const nineLeftStatus = elements.blacklistStatus.textContent;
listeners['blacklist:click']();
const eightLeftStatus = elements.blacklistStatus.textContent;
listeners['clear:click']();
const clearStatus = elements.blacklistStatus.textContent;

console.log(`Menu size: ${menuSize}`);
console.log(`Status with 10 dishes left: ${tenLeftStatus}`);
console.log(`Status with 9 dishes left: ${nineLeftStatus}`);
console.log(`Status with 8 dishes left: ${eightLeftStatus}`);
console.log(`Status after clearing: ${clearStatus}`);

const counterWorks = !tenLeftStatus.includes('dishes left') &&
    nineLeftStatus.endsWith('9 dishes left.') &&
    eightLeftStatus.endsWith('8 dishes left.') &&
    clearStatus === 'No dishes blacklisted this session.';
const expectedWorking = expectation === 'expect-working';
if (counterWorks !== expectedWorking) {
    console.error(`FAIL: expected working counter = ${expectedWorking}`);
    process.exit(1);
}
console.log('PASS');
