const fs = require('node:fs');
const vm = require('node:vm');

const [htmlPath, expectation] = process.argv.slice(2);
const validExpectations = new Set([
    'expect-cluster-repeat',
    'expect-no-cluster-repeat',
    'stress-no-cluster-repeat'
]);

if (!htmlPath || !validExpectations.has(expectation)) {
    console.error(
        'Usage: node cluster-regression-test.js <index.html> ' +
        '<expect-cluster-repeat|expect-no-cluster-repeat|stress-no-cluster-repeat>'
    );
    process.exit(2);
}

const dishClusters = {
    Pizza: 'italian',
    Pasta: 'italian',
    Lasagna: 'italian',
    Risotto: 'italian',
    Gnocchi: 'italian',
    Ravioli: 'italian',
    Calzone: 'italian',
    Sushi: 'bowls',
    Curry: 'bowls',
    'Fried Rice': 'bowls',
    'Seafood Bowl': 'bowls',
    'Poke Bowl': 'bowls',
    'Burrito Bowl': 'bowls',
    'Buddha Bowl': 'bowls',
    Burger: 'handheld',
    Tacos: 'handheld',
    Sandwich: 'handheld',
    'Hot Dog': 'handheld',
    'Falafel Wrap': 'handheld',
    'Cheese Toastie': 'handheld',
    'Avocado Toast': 'handheld',
    Ramen: 'soups',
    Soup: 'soups',
    Pho: 'soups',
    'Tomato Soup': 'soups',
    'Miso Soup': 'soups',
    'Lentil Soup': 'soups',
    Chowder: 'soups',
    Steak: 'grill',
    BBQ: 'grill',
    'Grilled Chicken': 'grill',
    'Fish & Chips': 'grill',
    'Grilled Salmon': 'grill',
    Kebab: 'grill',
    'Roast Vegetables': 'grill',
    Salad: 'light-meals',
    Omelette: 'light-meals',
    'Veggie Stir-fry': 'light-meals',
    Chili: 'light-meals',
    Quiche: 'light-meals',
    'Greek Salad': 'light-meals',
    'Fruit Bowl': 'light-meals'
};

const html = fs.readFileSync(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length === 0) {
    throw new Error('No inline script found in the application');
}

if (expectation !== 'expect-cluster-repeat') {
    const configuredClusters = [...html.matchAll(
        /\{ name: "([^"]+)", icon: "fas fa-[^"]+", cluster: "([^"]+)" \}/g
    )].map(([, dish, cluster]) => ({ dish, cluster }));
    const mismatches = configuredClusters.filter(
        ({ dish, cluster }) => dishClusters[dish] !== cluster
    );

    if (configuredClusters.length !== 42 || mismatches.length > 0) {
        throw new Error('The page does not contain the expected 42 cluster assignments');
    }

    const clusterSizes = configuredClusters.reduce((result, { cluster }) => {
        result[cluster] = (result[cluster] ?? 0) + 1;
        return result;
    }, {});
    console.log(
        `Configured clusters: ${Object.entries(clusterSizes)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([cluster, size]) => `${cluster}=${size}`)
            .join(', ')}`
    );
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

if (expectation === 'stress-no-cluster-repeat') {
    let seed = 987654321;
    deterministicMath.random = () => {
        seed = (1664525 * seed + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    clickCount = 99999;
    randomDescription = 'seeded LCG (seed 987654321)';
} else {
    const randomValues = [0.21, 0.40];
    deterministicMath.random = () => randomValues.shift() ?? 0.40;
    clickCount = 1;
    randomDescription = '0.21, 0.40';
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

const unknownDishes = displayedDishes.filter((dish) => !dishClusters[dish]);
if (unknownDishes.length > 0) {
    throw new Error(`Dishes without a test cluster: ${[...new Set(unknownDishes)].join(', ')}`);
}

let clusterRepeatCount = 0;
for (let index = 1; index < displayedDishes.length; index += 1) {
    if (dishClusters[displayedDishes[index]] === dishClusters[displayedDishes[index - 1]]) {
        clusterRepeatCount += 1;
    }
}

console.log(`Deterministic random inputs: ${randomDescription}`);
if (expectation === 'stress-no-cluster-repeat') {
    console.log(`Selections checked: ${displayedDishes.length}`);
    console.log(`Unique dishes selected: ${new Set(displayedDishes).size}`);
    console.log(`Consecutive same-cluster transitions: ${clusterRepeatCount}`);
} else {
    const firstTwo = displayedDishes.slice(0, 2);
    console.log(`Displayed dishes: ${firstTwo.join(' -> ')}`);
    console.log(`Displayed clusters: ${firstTwo.map((dish) => dishClusters[dish]).join(' -> ')}`);
    console.log(`Consecutive same-cluster transition observed: ${clusterRepeatCount > 0}`);
}

const expectedRepeat = expectation === 'expect-cluster-repeat';
if ((clusterRepeatCount > 0) !== expectedRepeat) {
    console.error(`FAIL: expected a same-cluster transition = ${expectedRepeat}`);
    process.exit(1);
}

if (expectation === 'stress-no-cluster-repeat' && new Set(displayedDishes).size !== 42) {
    console.error('FAIL: not every dish remained reachable');
    process.exit(1);
}

console.log('PASS');
