const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {Session}=require('../nippn/assets/health-ocr-runtime');
function factory(file,{failLanguage=false,stallLoad=false}={}){
 let wire,terminated=0,messages=[];
 const native={onerror:null};
 const adapters={defaultOptions:{logger(){}},spawnWorker:()=>native,terminateWorker:()=>{terminated++},onMessage:(_,h)=>wire=h,loadImage:async x=>x,send:(_,m)=>{messages.push(m);if(m.action==='recognize'||stallLoad)return;queueMicrotask(()=>wire({jobId:m.jobId,workerId:m.workerId,action:m.action,status:failLanguage&&m.action==='loadLanguage'?'reject':'resolve',data:'fixture language load failed'}));}};
 const module={exports:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),{module,require:p=>p.endsWith('resolvePaths')?x=>x:p.endsWith('circularize')?x=>x:p.endsWith('createJob')?x=>({id:'fixture-'+messages.length,...x}):p.endsWith('getId')?()=>1:p.endsWith('/log')?{log(){}}:p.endsWith('/OEM')?{DEFAULT:3,LSTM_ONLY:1}:p.endsWith('worker/node')?adapters:null,Error,Promise,console});return {create:module.exports,native,get terminated(){return terminated},messages};
}
async function rejectSoon(p){const result=await Promise.race([p.then(()=>({resolved:true}),e=>({error:e})),new Promise(r=>setTimeout(()=>r({pending:true}),100))]);assert(result.error,'operation must reject instead of leaving the promise pending');return result.error;}
(async()=>{
 const source=process.env.BP_OCR_WORKER_SOURCE||__dirname+'/../nippn/assets/ocr/lifecycle/createWorker.js';
 let f=factory(source,{failLanguage:true});await rejectSoon(f.create('jpn',1,{errorHandler(){}}));assert.equal(f.terminated,1,'failed initialization must terminate its native worker');
 f=factory(source,{stallLoad:true});let abort=new AbortController();const pending=f.create('jpn',1,{abortSignal:abort.signal});abort.abort();await rejectSoon(pending);assert.equal(f.terminated,1);
 f=factory(source);const w=await f.create('jpn',1,{});const job=w.recognize(new Uint8Array([1]));await Promise.resolve();f.native.onerror({message:'fixture worker crash'});await rejectSoon(job);assert.equal(f.terminated,1);
 f=factory(source);abort=new AbortController();const ready=await f.create('jpn',1,{abortSignal:abort.signal});const a=ready.recognize(new Uint8Array([1])),b=ready.recognize(new Uint8Array([2]));await Promise.resolve();abort.abort();await Promise.all([rejectSoon(a),rejectSoon(b)]);assert.equal(f.terminated,1);
 let session=new Session();const start=Date.now();await assert.rejects(session.run('engine',()=>new Promise(()=>{}),15),e=>e.stage==='engine'&&e.code==='timeout');assert(Date.now()-start<1000);
 session=new Session();const active=session.run('recognize',()=>new Promise(()=>{}),10000);session.cancel();await assert.rejects(active,e=>e.code==='cancelled');
 session=new Session();assert.equal(await session.run('recognize',()=>42,100),42);session.cancel();await assert.rejects(session.run('engine',()=>1),e=>e.code==='cancelled');
 session=new Session();let touches=0;const interval=setInterval(()=>{session.touch();touches++},5);await assert.rejects(session.run('recognize',()=>new Promise(()=>{}),15,35),e=>e.code==='timeout');clearInterval(interval);assert(touches>2,'progress must not defeat the total deadline');
 session=new Session();await assert.rejects(session.run('engine',()=>Promise.reject('model unavailable'),50),e=>e instanceof Error&&e.stage==='engine');
 console.log('PASS: 9 OCR recovery checks: failed initialization, startup abort, crash, in-flight abort, timeout, cancellation, completion, progress deadline.');
})().catch(e=>{console.error(e);process.exitCode=1});
