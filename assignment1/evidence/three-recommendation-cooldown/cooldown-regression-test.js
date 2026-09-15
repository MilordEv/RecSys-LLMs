const fs = require('node:fs');
const vm = require('node:vm');

const [htmlPath, expectation] = process.argv.slice(2);
const validExpectations = new Set([
    'expect-early-repeat',
    'expect-no-early-repeat',
    'expect-return-after-cooldown',
    'stress-no-early-repeat'
]);

if (!htmlPath || !validExpectations.has(expectation)) {
    console.error(
        'Usage: node cooldown-regression-test.js <index.html> ' +
        '<expect-early-repeat|expect-no-early-repeat|expect-return-after-cooldown|' +
        'stress-no-early-repeat>'
    );
    process.exit(2);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length === 0) {
    throw new Error('No inline script found in the application');
}

const displayedDishes = [];
const listeners = {};
const elements = {
    generateBtn: {
        disabled: false,
        addEventListener(event, callback) {
            listeners[event] = callback;
        }
    },
    blacklistBtn: { disabled: false, addEventListener() {} },
    clearBlacklistBtn: { hidden: true, addEventListener() {} },
    blacklistStatus: { textContent: '' },
    foodIcon: { innerHTML: '' },
    foodName: {
        _textContent: '',
        set textContent(value) {
            this._textContent = value;
            if (value !== 'Thinking...') {
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

const deterministicMath = Object.create(Math);
let clickCount;
let randomDescription;

if (expectation === 'stress-no-early-repeat') {
    let seed = 246813579;
    deterministicMath.random = () => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    clickCount = 99999;
    randomDescription = 'seeded LCG (seed 246813579)';
} else {
    const randomValues = expectation === 'expect-return-after-cooldown'
        ? [0.01, 0.01, 0.01, 0.01, 0.01]
        : [0.01, 0.01, 0.01];
    deterministicMath.random = () => randomValues.shift() ?? 0.01;
    clickCount = expectation === 'expect-return-after-cooldown' ? 4 : 2;
    randomDescription = randomValues.map(() => '0.01').join(', ');
}

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
for (let click = 0; click < clickCount; click += 1) {
    listeners.click();
}

let cooldownViolationCount = 0;
for (let index = 1; index < displayedDishes.length; index += 1) {
    const priorWindow = displayedDishes.slice(Math.max(0, index - 3), index);
    if (priorWindow.includes(displayedDishes[index])) {
        cooldownViolationCount += 1;
    }
}

console.log(`Deterministic random inputs: ${randomDescription}`);
if (expectation === 'stress-no-early-repeat') {
    console.log(`Selections checked: ${displayedDishes.length}`);
    console.log(`Unique dishes selected: ${new Set(displayedDishes).size}`);
    console.log(`Three-recommendation cooldown violations: ${cooldownViolationCount}`);
} else {
    console.log(`Displayed dishes: ${displayedDishes.join(' -> ')}`);
    console.log(`Early repeat observed: ${cooldownViolationCount > 0}`);
}

const expectedViolation = expectation === 'expect-early-repeat';
if ((cooldownViolationCount > 0) !== expectedViolation) {
    console.error(`FAIL: expected an early repeat = ${expectedViolation}`);
    process.exit(1);
}

if (expectation === 'stress-no-early-repeat' && new Set(displayedDishes).size !== 42) {
    console.error('FAIL: not every dish remained reachable');
    process.exit(1);
}

if (
    expectation === 'expect-return-after-cooldown' &&
    displayedDishes[0] !== displayedDishes[4]
) {
    console.error('FAIL: the first dish did not become eligible after three other recommendations');
    process.exit(1);
}

console.log('PASS');
