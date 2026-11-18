// Regression contract for the explicitly required, previously removed results.
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const base=path.join(__dirname,'../nippn');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const renderedMarkup=html+fs.readFileSync(path.join(base,'assets/simulation-experience.js'),'utf8')+fs.readFileSync(path.join(base,'assets/nippn-seminar.js'),'utf8');
for(const id of ['chart','age80box','a80diffBig','lifespanResult','lifeLostBig','improveResult','roiBlock','roiProtect','roiSessionValue']){
 assert(renderedMarkup.includes('id="'+id+'"'), 'Required simulation result missing: '+id);
}
assert(!/src="[^"]*medical-review-ui\.js/.test(html),'The checkup-only replacement must not retire the required simulation results');
const core=fs.readFileSync(path.join(base,'assets/simulator-core.js'),'utf8');
for(const name of ['projectAsset','simulate','computeLifespan','computeExerciseValue']){
 assert(core.includes('function '+name+'('),'Calculation removed: '+name);
 assert(!new RegExp('function '+name+'\\([^)]*\\)\\s*\\{\\s*return null').test(core),'Calculation disabled: '+name);
}
const view=fs.readFileSync(path.join(base,'assets/message-first.js'),'utf8');
assert(!view.includes("$('modeSelect').hidden=true"),'Both result modes must remain accessible');
assert(view.includes('未検証の独自換算'),'Show assumptions and limitations alongside results');
console.log('PASS: asset graph, age-80 difference, healthy-year results, scenario comparison and exercise outputs are preserved; assumptions remain visible.');
