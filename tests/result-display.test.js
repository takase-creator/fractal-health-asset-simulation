const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise the actual run handler with a failed renderer, then a successful retry.
const source = fs.readFileSync(__dirname + '/../assets/simulator-core.js', 'utf8');
const handler = source.slice(source.indexOf('function runSimulation()'), source.indexOf('// シミュレーションボタン：'));
const classes = new Set(['pre-run']);
const elements = Object.fromEntries(['runBtn', 'simulationInputError', 'simulationResults', 'p1'].map(id => [id, {
  hidden: true, textContent: '', disabled: false, scrollIntoView() {},
  classList: {add() {}, remove() {}}, offsetWidth: 100
}]));
let fail = true, completed = 0, valid = true;
const context = {
  document: {body: {classList: {contains: key => classes.has(key), remove: key => classes.delete(key), add: key => classes.add(key)}}, getElementById: id => elements[id], querySelector: () => null},
  window: {dispatchEvent: event => {if (event.type === 'bp:simulation-complete') completed++;}},
  Event, setTimeout: fn => fn(), validateAll: () => valid,
  updateAll: () => {if(fail) throw new Error('Renderer unavailable'); elements.simulationInputError.hidden = true;},
  animateHero() {}, console: {error() {}}
};
vm.createContext(context); vm.runInContext(handler, context);
context.runSimulation();
assert.equal(elements.runBtn.disabled, false);
assert.equal(classes.has('pre-run'), true);
assert.equal(elements.simulationInputError.hidden, false);
assert.match(elements.simulationInputError.textContent, /もう一度/);
assert.equal(completed, 0);
fail = false;
context.runSimulation();
assert.equal(elements.runBtn.disabled, false);
assert.equal(classes.has('pre-run'), false);
assert.equal(completed, 1);
assert.equal(elements.simulationInputError.hidden, true);
valid = false;
context.runSimulation();
assert.equal(completed, 1);
assert.equal(elements.simulationInputError.hidden, false);
assert.match(elements.simulationInputError.textContent, /赤く表示/);
console.log('PASS: render failure restores button and pre-run state; retry succeeds; invalid input shows recovery instructions.');
