const fs = require('node:fs');
const vm = require('node:vm');

const [htmlPath, expectation] = process.argv.slice(2);

if (!htmlPath || !['expect-missing-control', 'expect-working'].includes(expectation)) {
    console.error(
        'Usage: node blacklist-regression-test.js <index.html> ' +
        '<expect-missing-control|expect-working>'
    );
    process.exit(2);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const hasBlacklistControl = html.includes('id="blacklistBtn"');
const menuSize = [...html.matchAll(
    /\{ name: "[^"]+", icon: "fas fa-[^"]+", cluster: "[^"]+" \}/g
)].length;

if (expectation === 'expect-missing-control') {
    console.log(`Blacklist control present: ${hasBlacklistControl}`);
    if (hasBlacklistControl) {
        console.error('FAIL: expected the original app to have no blacklist control');
        process.exit(1);
    }
    console.log('PASS');
    process.exit(0);
}

if (!hasBlacklistControl) {
    console.error('FAIL: blacklist control is missing');
    process.exit(1);
}

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length === 0) {
    throw new Error('No inline script found in the application');
}

const displayedDishes = [];
const listeners = {};

function createButton(name) {
    return {
        disabled: false,
        hidden: false,
        addEventListener(event, callback) {
            listeners[`${name}:${event}`] = callback;
        }
    };
}

const elements = {
    generateBtn: createButton('generate'),
    blacklistBtn: createButton('blacklist'),
    clearBlacklistBtn: createButton('clear'),
    blacklistStatus: { textContent: '' },
    foodIcon: { innerHTML: '' },
    foodName: {
        _textContent: '',
        set textContent(value) {
            this._textContent = value;
            if (value !== 'Thinking...' && value !== 'No dishes available') {
                displayedDishes.push(value);
            }
        },
        get textContent() {
            return this._textContent;
        }
    },
    lunchDisplay: {
        classList: {
            add() {},
            remove() {}
        }
    }
};

let seed = 135792468;
const initialRandomValues = [0.01];
const deterministicMath = Object.create(Math);
deterministicMath.random = () => {
    if (initialRandomValues.length > 0) {
        return initialRandomValues.shift();
    }
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
};

const context = {
    document: {
        addEventListener(event, callback) {
            if (event === 'DOMContentLoaded') {
                callback();
            }
        },
        getElementById(id) {
            return elements[id] ?? null;
        },
        querySelector(selector) {
            return {
                '.food-icon': elements.foodIcon,
                '.food-name': elements.foodName,
                '.lunch-display': elements.lunchDisplay
            }[selector];
        }
    },
    Math: deterministicMath,
    setTimeout(callback) {
        callback();
    }
};

vm.runInNewContext(scripts.at(-1)[1], context);

if (!listeners['blacklist:click'] || !listeners['clear:click']) {
    console.error('FAIL: blacklist or clear control has no click handler');
    process.exit(1);
}

const blacklistedDish = displayedDishes[0];
listeners['blacklist:click']();
for (let selection = 0; selection < 10000; selection += 1) {
    listeners['generate:click']();
}

const whileBlacklisted = displayedDishes.slice(1);
const appearancesWhileBlacklisted = whileBlacklisted.filter(
    (dish) => dish === blacklistedDish
).length;
const alternativesSeen = new Set(whileBlacklisted).size;

listeners['clear:click']();
const postClearStart = displayedDishes.length;
for (let selection = 0; selection < 10000; selection += 1) {
    listeners['generate:click']();
}
const appearancesAfterClear = displayedDishes
    .slice(postClearStart)
    .filter((dish) => dish === blacklistedDish)
    .length;

for (let exclusion = 0; exclusion < menuSize; exclusion += 1) {
    listeners['blacklist:click']();
}
const allBlacklistedStatus = elements.blacklistStatus.textContent;
const emptyState = elements.foodName.textContent;
const generationDisabledWhenEmpty = elements.generateBtn.disabled;

listeners['clear:click']();
listeners['generate:click']();
const recoveredDish = elements.foodName.textContent;

console.log(`Initially recommended dish: ${blacklistedDish}`);
console.log(`Appearances during 10,000 selections while blacklisted: ${appearancesWhileBlacklisted}`);
console.log(`Alternative dishes reached while blacklisted: ${alternativesSeen}`);
console.log(`Appearances during 10,000 selections after clearing: ${appearancesAfterClear}`);
console.log(`Status after excluding all dishes: ${allBlacklistedStatus}`);
console.log(`Empty state after excluding all dishes: ${emptyState}`);
console.log(`Generation disabled with no dishes available: ${generationDisabledWhenEmpty}`);
console.log(`Recommendation after clearing all exclusions: ${recoveredDish}`);
console.log(`Status after clearing: ${elements.blacklistStatus.textContent}`);

if (
    appearancesWhileBlacklisted !== 0 ||
    alternativesSeen !== menuSize - 1 ||
    appearancesAfterClear === 0 ||
    allBlacklistedStatus !== `${menuSize} dishes blacklisted this session. 0 dishes left.` ||
    emptyState !== 'No dishes available' ||
    !generationDisabledWhenEmpty ||
    recoveredDish === 'No dishes available' ||
    elements.blacklistStatus.textContent !== 'No dishes blacklisted this session.'
) {
    console.error('FAIL: blacklist behavior did not meet all expectations');
    process.exit(1);
}

console.log('PASS');
