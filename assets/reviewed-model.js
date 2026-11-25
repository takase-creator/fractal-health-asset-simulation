/* Reviewed 2026-11-26: no conversion from screening values / custom points to money or personal lifespan. */
(function(root){'use strict';
 function project(a,startAge,mode){
  let asset=a.assets,cumulativeMed=0,cumulativePT=0;const arr=[];
  const cost=mode==='baseline'?0:mode==='changed'?a.changedCost+a.exerciseCost:a.cost;
  const loss=mode==='baseline'?0:mode==='changed'?a.changedLoss:a.loss;
  for(let age=startAge;age<=80;age++){
   arr.push(asset);if(age===80)break;
   const working=age<a.retire;
   const income=working?a.income:a.pension;
   const incomeLoss=working?income*loss:0;
   const saving=working?income*a.saving-incomeLoss-cost:income-a.living-cost;
   // A negative balance represents a funding shortfall; do not assume investments earn on debt.
   asset+=Math.max(0,asset)*a.rate+saving;
   cumulativeMed+=cost;cumulativePT+=incomeLoss;
  }
  return {arr,cumulativeMed,cumulativePT,ptLossRate:loss,mMult:1};
 }
 function studyYears(gender){
  const female=gender==='female';
  return {mode:'observed-study-groups',loss:female?10.6:7.6,ci:female?'10.0〜11.3':'6.8〜8.4',
   maintainRemain:female?34.4:31.1,neglectRemain:female?23.7:23.5,
   highCI:female?'33.1〜35.5':'29.5〜32.5',lowCI:female?'22.6〜24.7':'22.3〜24.7',actions:[]};
 }
 const api={version:'2026-11-26.reviewed-financial-assumptions',project,studyYears};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BPReviewed=api;
})(typeof window==='undefined'?globalThis:window);
