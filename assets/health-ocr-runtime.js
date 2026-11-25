/* Bounded OCR stages; aborts do not leave a promise waiting for a dead worker. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BPOCRRuntime=factory();})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
function failure(code,stage){const e=new Error(code);e.code=code;e.stage=stage;return e;}
class Session{
 constructor(){this.controller=new AbortController();this.active=null;this.reason=null;}
 cancel(code='cancelled'){if(this.controller.signal.aborted)return;this.reason=failure(code,this.active?.name||'idle');this.controller.abort();}
 touch(){this.active?.touch();}
 async run(name,operation,timeout=45000,maxDuration=timeout*2){
  if(this.controller.signal.aborted)throw this.reason;
  const signal=this.controller.signal;let idleTimer,hardTimer,onAbort;
  const clear=()=>{clearTimeout(idleTimer);clearTimeout(hardTimer);signal.removeEventListener('abort',onAbort);this.active=null;};
  const watch=new Promise((_,reject)=>{
   onAbort=()=>reject(this.reason);signal.addEventListener('abort',onAbort,{once:true});
   const expire=()=>reject(failure('timeout',name));
   const touch=()=>{clearTimeout(idleTimer);idleTimer=setTimeout(expire,timeout);};
   this.active={name,touch};touch();hardTimer=setTimeout(expire,maxDuration);
  });
  try{return await Promise.race([Promise.resolve().then(operation),watch]);}
  catch(reason){const e=reason instanceof Error?reason:new Error(String(reason));if(!e.stage)e.stage=name;throw e;}
  finally{clear();}
 }
}
return {Session,failure};
});
