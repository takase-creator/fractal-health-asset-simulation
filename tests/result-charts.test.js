const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const model=require('../assets/medical-evidence-model.js');
const {checkupGraph,costGraph}=require('../assets/result-charts.js');
const graph=checkupGraph({checks:model.evaluate({hba1c:5.9,sbp:135,hdl:35,tg:160})},360);
assert.match(graph,/<svg/);assert.match(graph,/viewBox="0 0 360 376"/);
for(const text of ['HbA1c','5.9','135','35','160','判定値'])assert(graph.includes(text));
assert.match(graph,/<rect[^>]*fill="#a46400"/);
const tgUnknown=checkupGraph({checks:model.evaluate({tg:160},'unknown')});
assert(!tgUnknown.includes('>150</text>'));assert(tgUnknown.includes('>300</text>'));
assert(checkupGraph({checks:model.evaluate({tg:160},'fasting')}).includes('>150</text>'));
assert(checkupGraph({checks:model.evaluate({tg:160},'nonfasting')}).includes('>175</text>'));
const empty=checkupGraph({checks:model.evaluate({})});assert.match(empty,/未入力/);assert(!empty.includes('<svg'));
const cost=costGraph(model.costScenario(12,8,10),360);
assert.match(cost,/<svg/);assert.match(cost,/条件A 120万円、条件B 80万円。差額 40万円/);
assert.match(cost,/10年/);assert.match(cost,/stroke-dasharray="6 4"/);
for(const scenario of [[0,0,1],[12,12,60],[10000,0,60],[0,8,10]]){
 const output=costGraph(model.costScenario(...scenario),280);
 assert(output.includes('<svg'));assert(!/NaN|Infinity/.test(output));
}
assert.match(costGraph(null),/年額と比較年数/);
const injected={checks:{items:{x:{label:'<script>',unit:'" onclick="bad',value:1,guide:2,refer:3,level:'low'}}}};
assert(!checkupGraph(injected).includes('<script>'));
new vm.Script(fs.readFileSync(__dirname+'/../assets/min/result-charts.js','utf8'));
const minContext={module:{exports:{}},globalThis:{}};vm.createContext(minContext);vm.runInContext(fs.readFileSync(__dirname+'/../assets/min/result-charts.js','utf8'),minContext);
assert.equal(minContext.module.exports.costGraph(model.costScenario(12,8,10),360),cost);
console.log('PASS: checkup graphs, TG sampling conditions, explicit cost math, equal/zero/negative differences, mobile widths, empty input, escaping, published bundle parity.');
