const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const prefix of ['','nippn/'])for(const name of ['simulator-core.js','reviewed-model.js','reviewed-ui.js','simulation-experience.js','nippn-seminar.js','health-ocr.js'])new vm.Script(fs.readFileSync(__dirname+'/../'+prefix+'assets/'+name,'utf8'));
const core=fs.readFileSync(__dirname+'/../nippn/assets/simulator-core.js','utf8');
const fun=name=>core.match(new RegExp('function '+name+'\\([^]*?\\n}'))[0];const t={};vm.createContext(t);vm.runInContext(fun('computeTrend'),t);
assert.match(t.computeTrend({hba1c:6.4}).rows[0].val,/67.8%/);assert.match(t.computeTrend({hba1c:6.5}).rows[0].val,/対象区分外/);assert.match(t.computeTrend({hba1c:null}).rows[0].val,/未入力/);
const c={};vm.createContext(c);vm.runInContext(fun('chartDomain'),c);for(const x of [[-4232,800,1745],[0,0,0],[-100,-90,-10],[100,200,300]]){const d=c.chartDomain(x);assert(d.min<Math.min(...x));assert(d.max>Math.max(...x));}
console.log('PASS: script syntax, research matching, missing inputs and graph bounds. Financial regressions are in reviewed-model.test.js.');
