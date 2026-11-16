const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/../health-asset-simulation.html','utf8')+'\n'+fs.readFileSync(__dirname+'/../assets/simulator-core.js','utf8');
const blocks=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
blocks.forEach((s,i)=>new vm.Script(s,{filename:'inline-'+i}));
for(const f of ['nippn-seminar.js','health-ocr.js'])new vm.Script(fs.readFileSync(__dirname+'/../assets/'+f,'utf8'));
const fun=name=>{const m=html.match(new RegExp('function '+name+'\\([^]*?\\n}'));assert(m,name);return m[0]};
let inputs={medicalShare:30,incomeLossAssumption:0};
const c={n:id=>inputs[id]??null,getIncomeCurve:()=>()=>100,savingRateForAge:()=>0.5,multiDiseaseMultiplier:()=>1,interpCost:()=>10,PHASE_COST:{diabetes:[],hyp:[],cvd:[0,0,0],nafld:[],ckd:[]},RETIREMENT_SPENDING:{male:50},INVEST_RATE:0};
vm.createContext(c);vm.runInContext(fun('projectAsset'),c);
const risk={risks:{glucose:50,bp:50,lipid:50,liver:50,kidney:50}};
let r=c.projectAsset(risk,'male',79,null,100,false);
assert.equal(r.arr.length,2);assert.equal(r.cumulativeMed,14);assert.equal(r.arr[1],136);assert.equal(r.cumulativePT,0);
inputs.medicalShare=0;r=c.projectAsset(risk,'male',79,null,100,false);assert.equal(r.cumulativeMed,0);assert.equal(r.arr[1],150);
inputs.medicalShare=100;r=c.projectAsset(risk,'male',79,null,100,false);assert.equal(r.cumulativeMed,47);
inputs.medicalShare=30;inputs.incomeLossAssumption=10;r=c.projectAsset(risk,'male',40,null,100,false);assert.equal(r.cumulativePT,250); // ages40–64 inclusive
const e={n:()=>null,computeRisk:o=>{assert.equal(o.exerciseHoursPerWeek,1.5);return{};},projectAsset:()=>({arr:[0,110]})};vm.createContext(e);vm.runInContext(fun('computeExerciseValue'),e);
let v=e.computeExerciseValue({exerciseHours:0,age:40},{red80:100});assert.equal(v.totalSessions,6240);assert.equal(v.diff,10);assert.equal(v.perSessionYen,100000/6240);assert.equal(e.computeExerciseValue({exerciseHours:1.5,age:40},{red80:100}),null);
const t={};vm.createContext(t);vm.runInContext(fun('computeTrend'),t);assert.match(t.computeTrend({hba1c:6.4}).rows[0].val,/67.8%/);assert.match(t.computeTrend({hba1c:6.5}).rows[0].val,/対象区分外/);
console.log('PASS: script syntax; cost share 0/30/100%; income-loss default and assumption; no extra year at80; 30min×3 conversion; HbA1c boundaries.');
