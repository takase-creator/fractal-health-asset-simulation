const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {project,studyYears}=require('../nippn/assets/reviewed-model.js');
const base={income:100,assets:100,saving:.5,retire:80,pension:0,living:0,rate:0,cost:10,changedCost:5,exerciseCost:2,loss:.1,changedLoss:0};
let p=project(base,79,'current');assert.deepEqual(p.arr,[100,130]);assert.equal(p.cumulativeMed,10);assert.equal(p.cumulativePT,10);
assert.deepEqual(project(base,79,'baseline').arr,[100,150]);assert.deepEqual(project(base,79,'changed').arr,[100,143]);
assert.deepEqual(project({...base,assets:-100,rate:.1},79,'current').arr,[-100,-70]);
assert.deepEqual(project({...base,retire:79,pension:20,living:30},79,'current').arr,[100,80]);
for(const age of [20,40,79]){
 const a=project(base,age,'baseline'),b=project(base,age,'current');assert.equal(a.arr.length,81-age);const delta=a.arr.at(-1)-b.arr.at(-1);assert.equal(delta,b.cumulativeMed+b.cumulativePT);
}
const compound=project({...base,assets:100,rate:.03},79,'current');assert.equal(compound.arr[1],133);
// Clinical readings and custom points cannot influence financial projection.
assert.deepEqual(project({...base,hba1c:5.1,risks:{glucose:0}},40,'current'),project({...base,hba1c:10,risks:{glucose:100}},40,'current'));
assert.equal(studyYears('male').loss,7.6);assert.equal(studyYears('female').loss,10.6);assert.equal(studyYears('female').maintainRemain,34.4);assert.equal(studyYears('male').ci,'6.8〜8.4');
const core=fs.readFileSync(__dirname+'/../nippn/assets/simulator-core.js','utf8');
assert(!core.includes('PHASE_COST'));assert(!core.includes('ls_saturate'));assert(!core.includes('getAnnualRisk'));assert(!core.includes('LIFETIME_BASE'));
const fun=name=>core.match(new RegExp('function '+name+'\\([^]*?\\n}'))[0];
const c={n:()=>null,projectAsset:()=>({arr:[0,90]})};vm.createContext(c);vm.runInContext(fun('computeExerciseValue'),c);
let r=c.computeExerciseValue({age:40},{red80:100});assert.equal(r.diff,-10);assert.equal(r.totalSessions,6240);assert.equal(r.perSessionYen,-100000/6240);
console.log('PASS reviewed model: annual cashflow, full income loss, no extra year, zero/negative scenarios, pension switch, debt handling, biomarker independence, published study values, signed exercise allocation.');
