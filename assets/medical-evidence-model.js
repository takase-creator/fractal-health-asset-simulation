/* Evidence review 2026-11-17. Screening thresholds are not diagnostic probabilities. */
(function(root){'use strict';
 const source='https://www.mhlw.go.jp/content/10900000/001172507.pdf';
 const rules={sbp:{label:'収縮期血圧',unit:'mmHg',guide:130,refer:140},dbp:{label:'拡張期血圧',unit:'mmHg',guide:85,refer:90},glucose:{label:'空腹時血糖',unit:'mg/dL',guide:100,refer:126},hba1c:{label:'HbA1c（NGSP）',unit:'%',guide:5.6,refer:6.5},ldl:{label:'LDL',unit:'mg/dL',guide:120,refer:140},hdl:{label:'HDL',unit:'mg/dL',guide:40,refer:null,lower:true},tg:{label:'中性脂肪',unit:'mg/dL',guide:150,refer:300,fasting:true},ast:{label:'AST',unit:'U/L',guide:31,refer:51},alt:{label:'ALT',unit:'U/L',guide:31,refer:51},ggt:{label:'γ-GTP',unit:'U/L',guide:51,refer:101}};
 const groups={glucose:['glucose','hba1c'],bp:['sbp','dbp'],lipid:['ldl','hdl','tg'],liver:['ast','alt','ggt'],kidney:[],musculo:[]};
 const labels={unknown:'未入力・評価対象外',low:'入力項目は判定値未満',mid:'保健指導判定値に該当',high:'受診勧奨判定値に該当'};
 function evaluate(values,fasting='unknown'){
  const items={};
  for(const [id,r] of Object.entries(rules)){
   const raw=values[id];if(raw==null||raw===''||!Number.isFinite(Number(raw))){items[id]={id,...r,value:null,level:'unknown'};continue;}
   const value=Number(raw);let guide=r.guide;
   if(r.fasting){if(!['fasting','nonfasting'].includes(fasting)){items[id]={id,...r,value,level:value>=r.refer?'high':'unknown',conditionUnknown:true,note:'採血条件を確認してください。'};continue;}guide=fasting==='nonfasting'?175:150;}
   const level=r.lower?(value<guide?'mid':'low'):(r.refer!==null&&value>=r.refer?'high':value>=guide?'mid':'low');
   items[id]={id,...r,guide,value,level};
  }
  const areas={};for(const [key,ids] of Object.entries(groups)){
   const available=ids.map(id=>items[id]).filter(item=>item.level!=='unknown');
   const level=available.some(i=>i.level==='high')?'high':available.some(i=>i.level==='mid')?'mid':available.length?'low':'unknown';
   areas[key]={level,label:labels[level],entered:available.length,total:ids.length,items:ids.map(id=>items[id]),partial:available.length<ids.length};
  }
  const notices=[];
  if((items.sbp.value!==null&&items.sbp.value>=160)||(items.dbp.value!==null&&items.dbp.value>=100))notices.push('血圧が公的資料で「すぐに医療機関の受診を」とされる範囲です。健診結果を持って速やかに医療機関へ相談してください。治療中の場合は主治医の指示に従ってください。');
  if((items.glucose.value!==null&&items.glucose.value>=126)||(items.hba1c.value!==null&&items.hba1c.value>=6.5))notices.push('血糖の受診勧奨判定値に該当します。未治療で定期通院していない方は、速やかに医療機関へ相談してください。治療中の場合は主治医に結果を共有してください。');
  if((items.ldl.value!==null&&items.ldl.value>=180)||(items.tg.value!==null&&items.tg.value>=500))notices.push('脂質が公的資料で早期受診を勧める範囲です。健診結果を持って医療機関へ相談してください。');
  return {version:'screening-thresholds-20261117',source,items,areas,notices};
 }
 // User-entered amounts only. No link from biomarkers, smoking or exercise to money.
 function costScenario(annualA,annualB,years){
  if([annualA,annualB,years].some(v=>v==null||v===''||!Number.isFinite(Number(v))))return null;
  annualA=Number(annualA);annualB=Number(annualB);years=Number(years);
  if(annualA<0||annualB<0||annualA>10000||annualB>10000||years<1||years>60||!Number.isInteger(years))return null;
  return {annualA,annualB,years,totalA:annualA*years,totalB:annualB*years,difference:(annualA-annualB)*years};
 }
 const api={source,rules,groups,labels,evaluate,costScenario};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BPClinical=api;
})(typeof window==='undefined'?globalThis:window);
