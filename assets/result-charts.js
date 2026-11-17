/* Graphs use entered checkup values and explicit cost assumptions only. */
(function(root){
 'use strict';
 const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const number=value=>Number(value.toFixed(2)).toLocaleString('ja-JP');
 function svg(width,height,title,description,body){
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+escape(title)+'"><title>'+escape(title)+'</title><desc>'+escape(description)+'</desc>'+body+'</svg>';
 }
 function checkupGraph(state,width=680){
  const rows=Object.values(state.checks.items).filter(item=>item.value!==null);
  if(!rows.length)return '<p class="result-chart-empty">検査値が未入力です。「数値を手入力する」または写真の読み取りで健診値を入力すると、ここにグラフを表示します。</p>';
  const left=8,right=width-16,span=right-left;
  const colors={low:'#247b72',mid:'#a46400',high:'#b64c66',unknown:'#627574'};
  let body='';
  rows.forEach((item,index)=>{
   const y=index*94+18;
   // Unknown sampling conditions must not acquire an assumed TG guidance cutoff.
   const guide=item.conditionUnknown?null:item.guide,refer=item.refer;
   const max=Math.max(item.value,guide||0,refer||0)*1.18;
   const x=value=>left+span*value/max;
   const color=colors[item.level];
   body+='<text x="'+left+'" y="'+y+'" fill="#173e36" font-size="13">'+escape(item.label)+'</text>';
   body+='<text x="'+right+'" y="'+y+'" text-anchor="end" fill="#173e36" font-size="13" font-weight="700">'+number(item.value)+' '+escape(item.unit)+'</text>';
   body+='<rect x="'+left+'" y="'+(y+13)+'" width="'+span+'" height="13" rx="3" fill="#edf2ef"/>';
   body+='<rect x="'+left+'" y="'+(y+13)+'" width="'+(x(item.value)-left)+'" height="13" rx="3" fill="'+color+'"/>';
   for(const [value,stroke,labelOffset] of [[guide,'#a46400',47],[refer,'#b64c66',63]])if(value!==null){
    body+='<line x1="'+x(value)+'" x2="'+x(value)+'" y1="'+(y+8)+'" y2="'+(y+31)+'" stroke="'+stroke+'" stroke-width="2" stroke-dasharray="3 2"/>';
    body+='<text x="'+x(value)+'" y="'+(y+labelOffset)+'" fill="'+stroke+'" font-size="12" text-anchor="middle">'+number(value)+'</text>';
   }
  });
  return svg(width,rows.length*94,'入力した健診値と公的な判定値の比較','検査項目ごとに単位と目盛りが異なります。棒の長さで異なる項目の重症度を比較することはできません。',body);
 }
 function costGraph(scenario,width=680){
  if(!scenario)return '<p class="result-chart-empty">条件A・Bの年額と比較年数を入力すると、累計費用のグラフを表示します。0円の場合は「0」と入力してください。</p>';
  const height=260,left=58,right=width-16,top=24,bottom=height-40;
  const highest=Math.max(scenario.totalA,scenario.totalB,1);
  const power=10**Math.floor(Math.log10(highest));
  const ceiling=Math.ceil(highest/power)*power;
  const x=year=>left+(right-left)*year/scenario.years;
  const y=amount=>bottom-(bottom-top)*amount/ceiling;
  let body='<text x="'+left+'" y="14" fill="#536b60" font-size="12">累計（万円）</text>';
  for(let i=0;i<=4;i++){
   const amount=ceiling*i/4,py=y(amount);
   body+='<line x1="'+left+'" x2="'+right+'" y1="'+py+'" y2="'+py+'" stroke="#d9e3de"/>';
   body+='<text x="'+(left-7)+'" y="'+(py+4)+'" text-anchor="end" fill="#536b60" font-size="12">'+number(amount)+'</text>';
  }
  for(const year of [...new Set([0,Math.floor(scenario.years/2),scenario.years])])body+='<text x="'+x(year)+'" y="'+(bottom+24)+'" text-anchor="middle" fill="#536b60" font-size="12">'+year+'年</text>';
  // Use a dashed second line so equal and zero-cost scenarios remain identifiable.
  for(const [annual,color,dash] of [[scenario.annualA,'#638fa7',''],[scenario.annualB,'#b64c66','6 4']]){
   body+='<path d="M '+x(0)+' '+y(0)+' L '+x(scenario.years)+' '+y(annual*scenario.years)+'" fill="none" stroke="'+color+'" stroke-width="3" stroke-dasharray="'+dash+'"/>';
   body+='<circle cx="'+x(scenario.years)+'" cy="'+y(annual*scenario.years)+'" r="4" fill="'+color+'"/>';
  }
  return svg(width,height,'条件A・Bの累計費用の比較',scenario.years+'年後：条件A '+number(scenario.totalA)+'万円、条件B '+number(scenario.totalB)+'万円。差額 '+number(scenario.difference)+'万円。入力年額を年数分だけ合計した比較です。',body);
 }
 const api={checkupGraph,costGraph};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 root.BPResultCharts=api;
 const $=id=>document.getElementById(id);
 const health=document.createElement('section');health.className='result-chart';health.id='checkupGraph';
 health.innerHTML='<h3>入力した健診値をグラフで確認</h3><p>棒は入力値、破線は公的な判定値です。項目ごとに単位・目盛りが異なり、棒の長さは病気の確率や重症度を示しません。</p><div id="checkupGraphPlot" class="result-chart-plot"></div><p class="result-chart-key"><span class="chart-guidance">破線：保健指導判定値</span><span class="chart-referral">破線：受診勧奨判定値</span></p><p class="result-chart-note">中性脂肪の採血条件が不明な場合は、共通の受診勧奨判定値のみ表示します。HDLは判定値を下回る場合に該当します。</p>';
 const attribution=document.createElement('a');attribution.href=BPClinical.source;attribution.target='_blank';attribution.rel='noopener';attribution.textContent='出典：厚生労働省「標準的な健診・保健指導プログラム（令和6年度版）」別紙5';health.append(attribution);
 document.querySelector('#p1 .pr-a').prepend(health);
 const costs=document.createElement('div');costs.className='result-chart';costs.id='costGraph';costs.innerHTML='<h4>条件A・Bの累計費用</h4><p class="result-chart-key"><span class="chart-cost-a">実線：条件A</span><span class="chart-cost-b">破線：条件B</span></p><div id="costGraphPlot" class="result-chart-plot"></div>';
 $('clinicalCostResult').after(costs);
 const width=element=>Math.max(280,Math.round(element.getBoundingClientRect().width)||680);
 let lastState=null,frame=0;
 function render(state){
  lastState=state;
  const plot=$('checkupGraphPlot');plot.innerHTML=checkupGraph(state,width(plot));
  const fields=['costAnnualA','costAnnualB','costYears'].map($);
  const scenario=fields.every(el=>el.value!==''&&el.checkValidity())?BPClinical.costScenario(...fields.map(el=>Number(el.value))):null;
  const costPlot=$('costGraphPlot');costPlot.innerHTML=costGraph(scenario,width(costPlot));
 }
 const previous=root.renderMedicalReview;
 root.renderMedicalReview=function(state){previous(state);render(state);};
 window.addEventListener('resize',()=>{if(frame)cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{frame=0;if(lastState)render(lastState);});});
 render(computeRisk());
})(typeof window==='undefined'?globalThis:window);
