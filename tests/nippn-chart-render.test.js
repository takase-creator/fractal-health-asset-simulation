const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const core=fs.readFileSync(__dirname+'/../nippn/assets/simulator-core.js','utf8');
const source=core.slice(core.indexOf('function chartDomain('),core.indexOf('// 11. メイン更新関数'));
let width=351,lines=0;const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(t,k)=>k in t?t[k]:()=>{if(k==='lineTo')lines++},set:(t,k,v)=>(t[k]=v,true)});
const cv={parentElement:{get clientWidth(){return width}},style:{},getContext:()=>ctx};const sandbox={document:{getElementById:()=>cv},window:{devicePixelRatio:2},getComputedStyle:()=>({paddingLeft:'0',paddingRight:'0'})};vm.createContext(sandbox);vm.runInContext(source,sandbox);
sandbox.drawChart([40,60,65,80],[100,200,180,150],[100,150,50,-20],40,null);assert.equal(cv.height,460);assert.equal(cv.width,702);assert(lines>8);
const before={w:cv.width,h:cv.height};width=0;sandbox.drawChart([40,80],[10,20],[10,0],40,null);assert.deepEqual({w:cv.width,h:cv.height},before,'Closing the section must preserve chart pixels');
width=390;sandbox.drawChart([40,80],[10,20],[10,0],40,null);assert.equal(cv.width,780);assert.equal(cv.style.height,'230px');
console.log('PASS: readable mobile canvas size, populated curves, hidden-panel preservation and redraw geometry.');
