const fs = require('node:fs');
const vm = require('node:vm');

const [htmlPath, expectation] = process.argv.slice(2);

if (!htmlPath || !['expect-repeat', 'expect-no-repeat', 'stress-no-repeat'].includes(expectation)) {
    console.error('Usage: node regression-test.js <index.html> <expect-repeat|expect-no-repeat|stress-no-repeat>');
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
let randomDescription;
let clickCount;

if (expectation === 'stress-no-repeat') {
    let seed = 123456789;
    deterministicMath.random = () => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    randomDescription = 'seeded LCG (seed 123456789)';
    clickCount = 99999;
} else {
    const randomValues = [0.01, 0.01];
    deterministicMath.random = () => randomValues.shift() ?? 0.01;
    randomDescription = '0.01, 0.01';
    clickCount = 1;
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

let repeatCount = 0;
for (let index = 1; index < displayedDishes.length; index += 1) {
    if (displayedDishes[index] === displayedDishes[index - 1]) {
        repeatCount += 1;
    }
}
const hasConsecutiveRepeat = repeatCount > 0;

console.log(`Deterministic random inputs: ${randomDescription}`);
if (expectation === 'stress-no-repeat') {
    const counts = Object.entries(
        displayedDishes.reduce((result, dish) => {
            result[dish] = (result[dish] ?? 0) + 1;
            return result;
        }, {})
    ).sort(([left], [right]) => left.localeCompare(right));
    console.log(`Selections checked: ${displayedDishes.length}`);
    console.log(`Consecutive repeats: ${repeatCount}`);
    console.log(`Dish counts: ${counts.map(([dish, count]) => `${dish}=${count}`).join(', ')}`);
} else {
    console.log(`Displayed dishes: ${displayedDishes.slice(0, 2).join(' -> ')}`);
    console.log(`Consecutive repeat observed: ${hasConsecutiveRepeat}`);
}

const expectedRepeat = expectation === 'expect-repeat';
if (hasConsecutiveRepeat !== expectedRepeat) {
    console.error(`FAIL: expected consecutive repeat = ${expectedRepeat}`);
    process.exit(1);
}

console.log('PASS');
