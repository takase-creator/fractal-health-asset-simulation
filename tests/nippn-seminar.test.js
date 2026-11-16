const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const core=fs.readFileSync(__dirname+'/../assets/simulator-core.js','utf8');
for(const file of ['simulator-core.js','nippn-seminar.js','simulation-experience.js','medical-evidence-model.js','medical-review-ui.js','health-ocr.js'])new vm.Script(fs.readFileSync(__dirname+'/../assets/'+file,'utf8'));
for(const name of ['projectAsset','getAnnualRisk','phaseOf','interpCost','computeLifespan','ls_saturate','smokingExcessFraction'])assert(!core.includes('function '+name+'('),'removed unsupported model: '+name);
const exercise=core.match(/function computeExerciseValue\([\s\S]*?\n}/)[0];const c={};vm.createContext(c);vm.runInContext(exercise,c);assert.equal(c.computeExerciseValue({exerciseHours:0},{}),null);
const trend=core.match(/function computeTrend\([\s\S]*?\n}/)[0];vm.runInContext(trend,c);assert.match(c.computeTrend({hba1c:6.4}).rows[0].val,/67.8%/);assert.match(c.computeTrend({hba1c:6.5}).rows[0].val,/対象区分外/);assert.match(c.computeTrend({hba1c:5.9}).srcs[0],/Kaplan/);
console.log('PASS syntax; unsupported disease/cost/life models removed; exercise savings unavailable; cohort data retained without personal prediction.');
