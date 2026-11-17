
'use strict';

// ═══════════════════════════════════════════════════
// 0. 公開期間の締切（有効期限）チェック
// ═══════════════════════════════════════════════════
// 2027年12月31日（JST）をもって公開終了。2028/1/1 00:00 JST 以降は終了画面を表示。
const PUBLISH_END = new Date('2028-01-01T00:00:00+09:00');
if (new Date() >= PUBLISH_END) {
  document.getElementById('expiryOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

// ═══════════════════════════════════════════════════
// 1. 定数・テーブル定義
// ═══════════════════════════════════════════════════

// Income, pension and asset forecasts removed: no validated individual model.

// ═══════════════════════════════════════════════════
// 2. UI初期化
// ═══════════════════════════════════════════════════
const ageEl = document.getElementById('age');
for(let a=20;a<=79;a++){
  const o=document.createElement('option');
  o.value=a; o.textContent=`${a}歳`;
  if(a===40)o.selected=true;
  ageEl.appendChild(o);
}

// ═══════════════════════════════════════════════════
// 3. バリデーション
// ═══════════════════════════════════════════════════
const RULES={
  height:{min:100,max:250},weight:{min:20,max:300},waist:{min:40,max:200},
  sbp:{min:60,max:260},dbp:{min:30,max:160},glucose:{min:40,max:600},
  hba1c:{min:3,max:15},ldl:{min:30,max:400},hdl:{min:15,max:150},tg:{min:20,max:1500},
  ast:{min:5,max:1000},alt:{min:5,max:1000},ggt:{min:5,max:2000}
};

function n(id){const v=document.getElementById(id)?.value;return(v===''||v==null)?null:Number(v);}

function validateField(id){
  const r=RULES[id];if(!r)return true;
  const v=n(id),el=document.getElementById(id),err=document.getElementById('e-'+id);
  if(v===null){el.classList.remove('err');if(err)err.classList.remove('show');return true;}
  if(!Number.isFinite(v)||!el.checkValidity()||v<r.min||v>r.max){el.classList.add('err');if(err)err.classList.add('show');return false;}
  el.classList.remove('err');if(err)err.classList.remove('show');return true;
}
Object.keys(RULES).forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener('blur',()=>validateField(id));
});

// 試算精度メーター：健診項目を入れるほど 簡易→標準→詳細 に上昇（即時フィードバック）
function updatePrecisionMeter(){
 const keys=Object.keys(RULES);const entered=keys.filter(id=>n(id)!==null).length;
 const lvl=document.getElementById('pmLevel');if(lvl){lvl.textContent=`${entered}/${keys.length}項目`;lvl.dataset.lv='入力状況';}
 const fill=document.getElementById('pmFill');if(fill)fill.style.width=(entered/keys.length*100)+'%';
 const note=document.getElementById('pmNote');if(note)note.textContent='未入力の検査項目は評価できません。入力数は診断や予測の精度を示すものではありません。';
}
Object.keys(RULES).forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener('input',updatePrecisionMeter);
});
updatePrecisionMeter();
function validateAll(){
 let ok=true;Object.keys(RULES).forEach(id=>{if(!validateField(id))ok=false;});
 return ok;
}

// Symptom selection was removed; checkup/lifestyle inputs remain the model inputs.
function syms(){return [];}

const HABIT_HOURS={none:0,'30x1':0.5,'30x2':1,'30x3':1.5,'60x1':1,'60x2':2,'60x3':3};

/* storage安全ラッパ：プライベートブラウズ等でstorageが例外でも落ちない（本番堅牢化） */
var _fwSS=null,_fwLS=null;
try{ _fwSS=window.sessionStorage; }catch(e){}
try{ _fwLS=window.localStorage; }catch(e){}
var _fwMem={};
function ssGet(k){ k=(window.BP_STORAGE_NAMESPACE||'')+k; try{ if(_fwSS) return _fwSS.getItem(k); }catch(e){} return (('s:'+k) in _fwMem)? _fwMem['s:'+k] : null; }
function ssSet(k,v){ k=(window.BP_STORAGE_NAMESPACE||'')+k; try{ if(_fwSS){ _fwSS.setItem(k,v); return; } }catch(e){} _fwMem['s:'+k]=v; }
function lsGet(k){ k=(window.BP_STORAGE_NAMESPACE||'')+k; try{ if(_fwLS) return _fwLS.getItem(k); }catch(e){} return (('l:'+k) in _fwMem)? _fwMem['l:'+k] : null; }
function lsSet(k,v){ k=(window.BP_STORAGE_NAMESPACE||'')+k; try{ if(_fwLS){ _fwLS.setItem(k,v); return; } }catch(e){} _fwMem['l:'+k]=v; }

function computeRisk(){
 const values=Object.fromEntries(Object.keys(RULES).map(id=>[id,n(id)]));
 const gender=document.getElementById('gender').value,age=Number(document.getElementById('age').value),habit=document.getElementById('habit').value;
 const checks=BPClinical.evaluate(values,document.getElementById('tgFasting')?.value||'unknown');
 const bmi=values.height&&values.weight?values.weight/Math.pow(values.height/100,2):null;
 return {...values,gender,age,habit,bmi,exerciseHours:HABIT_HOURS[habit]??0,smoking:document.getElementById('smoking').value,entered:Object.values(values).filter(v=>v!==null).length,checks,risks:Object.fromEntries(Object.keys(BPClinical.groups).map(k=>[k,null])),medScore:null};
}

// ═══════════════════════════════════════════════════
// 5. 経年リスク増加（論文準拠）
// ═══════════════════════════════════════════════════
function computeTrend(s){
 const rows=[],srcs=[];
 if(s.hba1c!==null&&s.hba1c>=6.5){
   rows.push({label:'HbA1cの入力値',val:'6.5%以上。研究の対象区分外です。健診の判定・医療機関の案内を確認してください。',ok:false});
 }else if(s.hba1c!==null){
   const h=s.hba1c;
   if(Math.abs(h*10-Math.round(h*10))>0.00001){
     rows.push({label:'研究との照合',val:'この研究は小数第1位のHbA1c区分です。健診票の桁数・単位を確認してください。個人の確率へ換算はしません。',ok:false});
   }else{
     const band=h>=6.4?['6.4',67.8,48.7,'40.8–58.1']:h>=6.2?['6.2–6.3',51.6,26.3,'23.3–30.1']:h>=6?['6.0–6.1',27.5,8.8,'8.0–10.1']:h>=5.8?['5.8–5.9',13.8,3.4,'2.9–3.7']:h>=5.6?['5.6–5.7',8.9,2.3,'2.0–2.5']:['5.5以下',3.6,1,null];
     rows.push({label:`研究の集団値｜HbA1c ${band[0]}%群`,val:`5年間の糖尿病発症割合 ${band[1]}%（個人の発症確率ではありません）`,ok:h<5.6});
     if(band[2]!==1)rows.push({label:'研究の比較指標｜調整ハザード比（HR）',val:`HbA1c 5.5%以下群との比較 ${band[2]}倍（95%信頼区間 ${band[3]}）。発症割合の比とは異なります。`,ok:false});
     srcs.push('Kawahara et al., PLoS ONE 2015：日本人52,781人、平均追跡3.7年・5年累積発症割合（Kaplan–Meier法）。研究対象は開始時HbA1c 6.5%未満・糖尿病未診断等。観察研究の関連であり、改善効果の証明ではありません。');
   }
 }else{
   rows.push({label:'研究の集団データ',val:'HbA1cを入力すると、該当する区分の発症割合と比較指標を表示します。未入力のため研究との照合はできません。',ok:true});
 }
 return {rows,srcs};
}

// Removed unvalidated disease progression, cost conversion and individual healthy-year forecasts.
let _lsMode='unselected';

function setMode(m){
  _lsMode=(m==='lifespan')?'lifespan':'asset';
  document.body.dataset.mode=_lsMode;
  const a=document.getElementById('modeAsset'), l=document.getElementById('modeLife');
  if(a)a.classList.toggle('on',_lsMode==='asset');
  if(l)l.classList.toggle('on',_lsMode==='lifespan');
  if(a)a.setAttribute('aria-pressed',String(_lsMode==='asset'));
  if(l)l.setAttribute('aria-pressed',String(_lsMode==='lifespan'));
  const modeFlow=document.getElementById('modeFlow');
  if(modeFlow)modeFlow.hidden=false;
  window.dispatchEvent(new Event('scroll'));
  const modeContext=document.getElementById('modeContext');
  if(modeContext)modeContext.innerHTML=_lsMode==='lifespan'
    ? '生活習慣 → 健診結果 → シミュレーションの順に進めます。'
    : '生活習慣・資産情報 → 健診結果 → シミュレーションの順に進めます。';
  const consentLead=document.getElementById('consentLead');
  const consentLocal=document.getElementById('consentLocal');
  if(_lsMode==='lifespan'){
    if(consentLead)consentLead.textContent='入力した健診値を公的な判定値と照合します。個人の健康寿命・死亡年齢は予測しません。';
    if(consentLocal)consentLocal.innerHTML='入力した健診値・生活習慣は<strong>この端末内だけ</strong>で計算に使われます（生の数値は送信しません）';
  } else {
    if(consentLead)consentLead.textContent='入力した健診値を公的な判定値と照合します。費用の比較は、ご自身で入力した金額と年数だけで計算します。';
    if(consentLocal)consentLocal.innerHTML='入力した健診値・費用の条件は<strong>この端末内だけ</strong>で計算に使われます（生の数値は送信しません）';
  }
  const step1Title=document.getElementById('step1Title');
  if(step1Title)step1Title.textContent='テーマを選ぶ';
  const assetInfo=document.getElementById('assetInfoBox');
  if(assetInfo)assetInfo.setAttribute('aria-hidden',String(_lsMode==='lifespan'));
  const preRun=document.body.classList.contains('pre-run');
  const rb=document.getElementById('runBtn');
  if(rb)rb.textContent = preRun
    ? (_lsMode==='lifespan'?'健診値と研究を確認する':'健診値を確認する')
    : '入力した内容を確認する';
  // 実行前プレースホルダをモード連動＝"これから出る答え"を予告
  const pmT=document.querySelector('#prerunMsg .pm-t'), pmS=document.querySelector('#prerunMsg .pm-s');
  if(pmT)pmT.textContent='健診結果の確認';
  if(pmS) pmS.textContent = '入力後に実行ボタンを押すと、ここに表示されます。';
  const pmNext=document.getElementById('pmNext');
  if(pmNext) pmNext.textContent = _lsMode==='lifespan'
    ? '試算後は、生活習慣による年数差を比較できます。'
    : '試算後は、運動などの条件を変えて比較できます。';
  try{ updateAll(); }catch(e){}
  // 実行済みならモード切替でもう一方の結果へ誘導＋山場を再演出
  if(!preRun){
    const _t=_lsMode==='lifespan'?document.getElementById('lifespanResult'):document.getElementById('age80box');
    if(_t) _t.scrollIntoView({behavior:'smooth',block:'center'});
    animateHero();
  }
}
function clearMode(){
  _lsMode='unselected';
  document.body.dataset.mode='unselected';
  const a=document.getElementById('modeAsset'), l=document.getElementById('modeLife');
  if(a){a.classList.remove('on');a.setAttribute('aria-pressed','false');}
  if(l){l.classList.remove('on');l.setAttribute('aria-pressed','false');}
  const modeFlow=document.getElementById('modeFlow');
  if(modeFlow)modeFlow.hidden=true;
  const step1Title=document.getElementById('step1Title');
  if(step1Title)step1Title.textContent='テーマを選ぶ';
  window.dispatchEvent(new Event('scroll'));
}
['modeAsset','modeLife'].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener('click',()=>setMode(el.dataset.mode));
});

// A4レポート（画像保存・PDF印刷 共通）をモード対応で描画
function renderReportA4(s){
 const set=(id,value)=>{const e=document.getElementById(id);if(e)e.textContent=value;};
 set('raTitle','健診結果の確認レポート');set('raDate',new Date().toLocaleDateString('ja-JP'));
 set('raHeroLabel','健診値と公的な判定値を照合');
 const high=Object.values(s.checks.items).filter(i=>i.level==='high').length,mid=Object.values(s.checks.items).filter(i=>i.level==='mid').length;
 set('raFmLL','受診勧奨判定値に該当');set('raFmLV',high+'項目');set('raFmRL','保健指導判定値のみ該当');set('raFmRV',mid+'項目');set('raFmDL','確認できた検査項目');set('raFmDV',Object.values(s.checks.items).filter(i=>i.level!=='unknown').length+'項目');
 const esc=v=>String(v).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 document.getElementById('raRisks').innerHTML=RISK_LABELS.map(([label,key])=>'<div class="rr"><span class="rr-n">'+label+'</span><span class="rr-status">'+esc(s.checks.areas[key].label)+'</span></div>').join('');
 renderReportInputs();renderReportTrend(s);
 const cost=BPClinical.costScenario(n('costAnnualA'),n('costAnnualB'),n('costYears'));
 set('raDetailT','入力した費用の条件比較（任意）');
 document.getElementById('raDetail').innerHTML=cost?'<p>条件A：年'+cost.annualA+'万円 × '+cost.years+'年 = '+cost.totalA+'万円</p><p>条件B：年'+cost.annualB+'万円 × '+cost.years+'年 = '+cost.totalB+'万円</p><p>差額：'+Number(cost.difference.toFixed(2))+'万円（A−B）</p>':'費用は未入力です。健診値から医療費や運動による節約額は算出していません。';
 set('raMsg',s.checks.notices.length?s.checks.notices.join(' '):'健診票の判定・受診案内を確認してください。未入力・判定値未満でも疾病がないことを意味しません。治療中の方は主治医の指示を優先してください。');
 set('raFoot','出典：厚生労働省「標準的な健診・保健指導プログラム（令和6年度版）」別紙5。照合であり診断や特定保健指導の対象者選定ではありません。個人の寿命・発症確率・将来資産は計算しません。費用の比較は入力額×年数のみで、物価・運用・税・医療保険を自動反映しません。');
 if(window.BPResearch)BPResearch.annotateReport();
}

// PDF/画像レポートに「入力データ（基本情報・健診結果＋基準範囲）」を出力（入力された項目のみ）
function renderReportInputs(){
  const grid=document.getElementById('raInputGrid');
  if(!grid) return;
  const val=id=>{const e=document.getElementById(id); return e?String(e.value||'').trim():'';};
  const num=id=>{const v=val(id); return v===''?null:parseFloat(v);};
  const selTxt=id=>{const e=document.getElementById(id); return (e&&e.selectedIndex>=0&&e.options[e.selectedIndex])?e.options[e.selectedIndex].text:'';};
  const gv=id=>{const e=document.getElementById(id); return e?e.value:'';};
  const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const chip=o=>`<span class="ra-ichip${o.warn?' warn':''}"><span class="k">${esc(o.k)}</span><span class="v">${esc(o.v)}</span>${o.u?`<span class="u">${esc(o.u)}</span>`:''}${o.ref?`<span class="ref">${esc(o.ref)}</span>`:''}</span>`;
  // 基本情報
  const basic=[];
  const bpush=(k,v,warn)=>{ if(v) basic.push({k,v,warn:!!warn}); };
  bpush('性別', selTxt('gender'));
  bpush('年齢', val('age')?val('age')+'歳':'');
  bpush('身長', val('height')?val('height')+'cm':'');
  bpush('体重', val('weight')?val('weight')+'kg':'');
  const _wa=num('waist'), _g=gv('gender');
  if(val('waist')) bpush('腹囲', val('waist')+'cm');
  const _h=num('height'), _w=num('weight');
  if(_h>0&&_w>0){ const bmi=_w/Math.pow(_h/100,2); bpush('BMI', bmi.toFixed(1)); }
  bpush('運動習慣', selTxt('habit'));
  { let sm=selTxt('smoking'); const smv=gv('smoking');
    if(smv==='current'){ const c=val('cigCount'); sm=sm+(c?'（'+c+'本/日）':''); }
    bpush('喫煙', sm, smv==='current'); }


  // 健診値（基準範囲つき・入力があるものだけ）
  const labs=[];
  { const sbp=num('sbp'), dbp=num('dbp');
    if(val('sbp')||val('dbp')) labs.push({k:'血圧', v:(val('sbp')||'—')+'/'+(val('dbp')||'—'), u:'mmHg', ref:'保健指導判定値 ≥130/85', warn:(sbp!==null&&sbp>=130)||(dbp!==null&&dbp>=85)}); }
  const L=(k,id,u,lo,hi,ref)=>{const x=num(id),item=computeRisk().checks.items[id];if(x!==null)labs.push({k,v:val(id),u,ref,warn:['mid','high'].includes(item.level)});};
  L('LDL','ldl','mg/dL',null,119.999,'保健指導判定値 ≥120');
  L('HDL','hdl','mg/dL',40,null,'保健指導判定値 <40');
  const tg=BPClinical.evaluate({tg:num('tg')},document.getElementById('tgFasting')?.value||'unknown').items.tg;if(tg.value!==null)labs.push({k:'中性脂肪',v:val('tg'),u:'mg/dL',ref:tg.conditionUnknown?(tg.level==='high'?'受診勧奨判定値 ≥300（採血条件未確認）':'採血条件未確認'):'保健指導判定値 ≥'+tg.guide,warn:['mid','high'].includes(tg.level)});
  L('空腹時血糖','glucose','mg/dL',null,99,'保健指導判定値 ≥100');
  L('HbA1c','hba1c','%',null,5.5,'保健指導判定値 ≥5.6');
  L('AST','ast','U/L',null,30,'保健指導判定値 ≥31');
  L('ALT','alt','U/L',null,30,'保健指導判定値 ≥31');
  L('γ-GTP','ggt','U/L',null,50,'保健指導判定値 ≥51');
  let html='<div class="ra-igroup"><span class="ra-igl">基本情報</span>'+basic.map(chip).join('')+'</div>';
  html+='<div class="ra-igroup"><span class="ra-igl">健診値</span>'+(labs.length?labs.map(chip).join(''):'<span class="ra-inone">未入力（検査項目は照合できません）</span>')+'</div>';
  grid.innerHTML=html;
}

// PDF：「現状の数値が続いた場合の見込み」（computeTrend を再利用）
function renderReportTrend(s){
  const box=document.getElementById('raTrend');
  if(!box) return;
  let trend; try{ trend=computeTrend(s); }catch(e){ trend={rows:[]}; }
  const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const rows=(trend&&trend.rows)||[];
  box.innerHTML = rows.length
    ? rows.map(r=>`<div class="ra-tr ${r.ok?'ok':''}"><span class="tl">${esc(r.label)}</span><span class="tv">${esc(r.val)}</span></div>`).join('')
    : '<div class="ra-tr ok"><span class="tv">主要なリスクシグナルは検出されませんでした。この状態の維持を。</span></div>';
}

// Unvalidated intervention-to-money and lifetime medical-cost models removed.

// ═══════════════════════════════════════════════════
// 10. Canvas グラフ描画（HiDPI対応）
// ═══════════════════════════════════════════════════
function chartDomain(values){
 const low=Math.min(...values),high=Math.max(...values),span=Math.max(high-low,1);
 return {min:low-span*0.08,max:high+span*0.08};
}
function drawChart(ages,blueArr,redArr,startAge,greenArr){
  const cv=document.getElementById('chart');
  const wrap=cv.parentElement;
  const dW=Math.max(200,wrap.clientWidth-24);
  const dH=Math.round(dW*(window._chartRatio||0.34));
  const dpr=window.devicePixelRatio||1;
  cv.width=dW*dpr; cv.height=dH*dpr;
  cv.style.width=dW+'px'; cv.style.height=dH+'px';
  const ctx=cv.getContext('2d');
  ctx.scale(dpr,dpr);
  const W=dW,H=dH;
  ctx.clearRect(0,0,W,H);
  // チャート内テキストはUIと同じフォント・固定サイズ（画面幅で肥大化・重なりさせない）
  const CF='"Noto Sans JP","Hiragino Sans",Meiryo,sans-serif';
  const _cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

  const pad={l:52,r:14,t:12,b:28};
  const all=[...blueArr,...redArr,...(greenArr||[])];
  const domain=chartDomain(all);
  const minV=domain.min,maxV=domain.max;
  const n=ages.length;
  const xFn=i=>pad.l+(W-pad.l-pad.r)*(i/(n-1));
  const yFn=v=>H-pad.b-(H-pad.t-pad.b)*((v-minV)/(maxV-minV));

  // Grid
  ctx.strokeStyle='#e4ecef';ctx.lineWidth=1;
  const steps=4;
  for(let i=0;i<=steps;i++){
    const y=pad.t+(H-pad.t-pad.b)*(i/steps);
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    const val=minV+(maxV-minV)*(1-i/steps);
    ctx.fillStyle='#7a8284';
    ctx.font=`${_cl(Math.round(W/70),11,13)}px ${CF}`;
    ctx.fillText((val>=10000?Math.round(val/10000)+'億':Math.round(val/100)*100+'万'),2,y+4);
  }

  // 60歳マーカー（定年・再雇用開始）
  const idx60=ages.indexOf(60);
  if(idx60>=0){
    const x60=xFn(idx60);
    ctx.strokeStyle='#aabbcc';ctx.lineWidth=1;ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.moveTo(x60,pad.t);ctx.lineTo(x60,H-pad.b);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#7a8284';
    ctx.font=`${_cl(Math.round(W/80),10,12)}px ${CF}`;
    ctx.fillText('60歳',x60+2,pad.t+22);
  }

  // 65歳マーカー（年金移行）
  const idx65=ages.indexOf(65);
  if(idx65>=0){
    const x65=xFn(idx65);
    ctx.strokeStyle='#0fa8a3';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);
    ctx.beginPath();ctx.moveTo(x65,pad.t);ctx.lineTo(x65,H-pad.b);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#0fa8a3';
    ctx.font=`bold ${_cl(Math.round(W/80),10,12)}px ${CF}`;
    ctx.fillText('65歳',x65+3,pad.t+12);
  }

  // Fill area
  ctx.beginPath();
  blueArr.forEach((v,i)=>{const x=xFn(i),y=yFn(v);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
  redArr.slice().reverse().forEach((v,i)=>{
    const idx=n-1-i;ctx.lineTo(xFn(idx),yFn(v));
  });
  ctx.closePath();
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'rgba(89,105,107,.14)');
  grad.addColorStop(1,'rgba(89,105,107,.03)');
  ctx.fillStyle=grad;ctx.fill();

  // Lines
  function drawLine(arr,color,dash){
    ctx.strokeStyle=color;ctx.lineWidth=2.5;
    if(dash)ctx.setLineDash(dash);else ctx.setLineDash([]);
    ctx.beginPath();
    arr.forEach((v,i)=>{const x=xFn(i),y=yFn(v);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
    ctx.stroke();ctx.setLineDash([]);
    arr.forEach((v,i)=>{
      if(i%5===0||i===0||i===n-1){
        ctx.fillStyle=color;ctx.beginPath();
        ctx.arc(xFn(i),yFn(v),3.5,0,Math.PI*2);ctx.fill();
      }
    });
  }
  drawLine(redArr,'#d46f8e');
  if(greenArr)drawLine(greenArr,'#0a807c',[5,3]);
  drawLine(blueArr,'#638fa7');

  // X axis labels
  ctx.fillStyle='#60738f';
  const fs=_cl(Math.round(W/60),11,13);
  ctx.font=`${fs}px ${CF}`;
  ages.forEach((a,i)=>{
    if(a===startAge||a%10===0||a===80){
      ctx.fillText(`${a}歳`,xFn(i)-(a>=10?10:6),H-4);
    }
  });

  // Exact comparison values are shown below the chart; keep plot lines unobstructed.

}

// ═══════════════════════════════════════════════════
// 11. メイン更新関数
// ═══════════════════════════════════════════════════
function fmt(v){
  if(v>=10000) return (v/10000).toFixed(1)+'億円';
  return v.toLocaleString()+'万円';
}
function lv(s){return s>=70?'高':s>=40?'中':'低';}
function bc(s){return s>=70?'#e24c5e':s>=40?'#f0925a':'#0fa8a3';}
function fmtYen(v){return v>=10000?`約${(Math.round(v/1000)/10).toFixed(1)}万円`:`約${Math.round(v).toLocaleString()}円`;}

// 「運動習慣を30分×週3回にする」場合のみを取り出し、30分の運動1回あたりの資産防衛額を試算
function computeExerciseValue(){
 return null; // No validated causal conversion from exercise sessions to individual savings.
}

const RISK_LABELS=[
  ['糖代謝の検査値','glucose'],['血圧の検査値','bp'],['脂質の検査値','lipid'],
  ['肝機能の検査値','liver'],['腎機能','kidney'],['筋骨格・身体機能','musculo']
];

// 特定健診の基準値超え項目をカウント（2項目以上で要注意アラート表示）
function computeAlertFlags(s){
 return Object.values(s.checks.items).filter(i=>['mid','high'].includes(i.level)).map(i=>i.label+'：'+BPClinical.labels[i.level]);
}

// 結果を「いつか改善する」ではなく、明日できる一つの行動に落とし込む。
// 結果を「数字」だけで終わらせないための出口。医療診断ではなく、入力に応じて最初の行動を示す。
function renderNextPlan(s,alertFlags){
 document.getElementById('nextPlanTitle').textContent='社内の施策・受診案内を見る';
 document.getElementById('nextPlanSub').textContent='社内の健康施策と、健診後の受診案内をご紹介します。';
}

// 結果を「読む」だけで終わらせず、最も効果が見込める変化を一押しで試せるようにする

let simulationUpdateFrame=0;
function queueSimulationUpdate(){
 if(simulationUpdateFrame)return;
 simulationUpdateFrame=requestAnimationFrame(()=>{simulationUpdateFrame=0;updateAll();});
}
function updateAll(){
 if(simulationUpdateFrame){cancelAnimationFrame(simulationUpdateFrame);simulationUpdateFrame=0;}
 const invalid=Object.keys(RULES).map(id=>document.getElementById(id)).filter(e=>e&&!e.checkValidity());
 const warning=document.getElementById('simulationInputError');if(warning){warning.hidden=!invalid.length;warning.textContent=invalid.length?'入力範囲・単位を確認してください。修正するまで結果は更新されません。':'';}if(invalid.length)return;
 const s=computeRisk(),rEl=document.getElementById('riskRows');rEl.replaceChildren();
 RISK_LABELS.forEach(([label,key])=>{const area=s.checks.areas[key],row=document.createElement('div');row.className='risk-row';
 const title=document.createElement('h3');title.className='risk-name';title.textContent=label;
 const status=document.createElement('p');status.className='clinical-status';status.dataset.level=area.level;status.textContent=area.label;
 const data=document.createElement('p');data.className='clinical-values';data.textContent=area.total?area.items.filter(i=>i.value!==null).map(i=>i.label+' '+i.value+' '+i.unit+(i.conditionUnknown?'（採血条件未確認）':'')).join(' ／ ')||'検査値を入力すると照合できます。':key==='kidney'?'eGFR・尿蛋白などの検査を扱っていないため、評価しません。':'診察・身体機能の検査を行っていないため、数値評価しません。';
 row.append(title,status,data);
 if(area.partial&&area.entered){const note=document.createElement('p');note.className='clinical-partial';note.textContent=area.entered+'/'+area.total+'項目を照合。残りの項目は未確認です。';row.append(note);}rEl.append(row);
 });
 const trend=computeTrend(s);document.getElementById('trendRows').replaceChildren();trend.rows.forEach(r=>{const row=document.createElement('div');row.className='trend-row';const label=document.createElement('div');label.className='tlab';label.textContent=r.label;const value=document.createElement('div');value.className='tval';value.textContent=r.val;row.append(label,value);document.getElementById('trendRows').append(row);});document.getElementById('trendSrc').textContent=trend.srcs.join(' ／ ');
 document.getElementById('precText').textContent=s.entered+'項目入力';document.getElementById('precDetail').textContent='健診値 '+s.entered+'/13項目入力';
 document.getElementById('checkupAlert').style.display='none';renderNextPlan(s,[]);renderReportA4(s);
 if(typeof window.renderMedicalReview==='function')window.renderMedicalReview(s);
}

// ═══════════════════════════════════════════════════
// 12. イベント・タブ・リサイズ
// ═══════════════════════════════════════════════════
const panels=[document.getElementById('p0'),document.getElementById('p1')];

// ── 5ステップ・ナビ：クリックでジャンプ＋スクロール連動で現在地をハイライト ──
(function(){
  const navItems=Array.from(document.querySelectorAll('.step-nav-item'));
  function setActive(step){
    navItems.forEach(a=>{const active=a.dataset.step===String(step);a.classList.toggle('on',active);if(active)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
  }
  function syncAvailableSteps(){
    const isPreRun=document.body.classList.contains('pre-run');
    const modeUnset=_lsMode==='unselected';
    navItems.forEach(a=>{
      const locked=false; // Every step heading can be opened explicitly.
      a.setAttribute('aria-disabled',String(locked));
      if(locked) a.setAttribute('tabindex','-1');
      else a.removeAttribute('tabindex');
    });
  }
  // スクロール位置に応じて現在のステップを判定
  function onScroll(){
    syncAvailableSteps();
    const y=window.scrollY + 110;
    let cur=1;
    navItems.forEach(a=>{const el=document.querySelector(a.getAttribute('href'));if(el&&el.getClientRects().length>0&&el.getBoundingClientRect().top+window.scrollY<=y)cur=Number(a.dataset.step);});
    setActive(cur);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('hashchange',()=>{syncAvailableSteps();const item=navItems.find(a=>a.getAttribute('href')===location.hash);if(item&&item.getAttribute('aria-disabled')!=='true')setActive(item.dataset.step);else onScroll();});
  onScroll();
})();

// ── MetS自動判定バナー ──
function updateMetsBanner(){
 const banner=document.getElementById('metsBanner');if(banner)banner.style.display='none';
}
['waist','sbp','glucose','hba1c'].forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener('input',updateMetsBanner);
});
document.getElementById('gender').addEventListener('change',updateMetsBanner);

// 「現在喫煙中」を選んだ時だけ本数入力を表示する
function updateCigCountVisibility(){
  const show=document.getElementById('smoking').value==='current';
  document.getElementById('cigCountField').style.display=show?'':'none';
}
document.getElementById('smoking').addEventListener('change',()=>{
  updateCigCountVisibility();
  updateAll(); // 喫煙区分を変えたら即座に結果へ反映
});
// 本数を変えるたびリアルタイムで結果を更新（体重スライダーと同じ「触って試せる」挙動）
document.getElementById('cigCount').addEventListener('input',()=>{
  fwTrack('cig_count_change',{cigs:document.getElementById('cigCount').value});
  queueSimulationUpdate();
});
updateCigCountVisibility();

function resetPanels(){
  // 5ステップ・1カラム化により全パネル常時表示（タブ切替は廃止）
  panels.forEach(p=>p.classList.add('active-panel'));
}

window.addEventListener('resize',()=>{
  resetPanels();
  queueSimulationUpdate();
});

// 印刷時：グラフを縦長比率で再描画してA4横のスペースを活用
function redrawChart(){
  try{updateAll();}catch(e){}
}
window.addEventListener('beforeprint',()=>{
  window._chartRatio=0.42;redrawChart();
  const pd=document.getElementById('printDate');
  if(pd)pd.textContent=new Date().toLocaleDateString('ja-JP');
});
window.addEventListener('afterprint',()=>{window._chartRatio=null;redrawChart();});

// ═══════════════════════════════════════════════════
// 13. 流入元・計測トラッキング
// ═══════════════════════════════════════════════════
const _urlParams   = new URLSearchParams(location.search);
const _refSource   = _urlParams.get('utm_source')   || _urlParams.get('ref') || 'direct';
const _refMedium   = _urlParams.get('utm_medium')   || '';
const _refCampaign = _urlParams.get('utm_campaign') || '';
const _isPartner      = _refSource === 'partner';
const _refPage     = location.pathname + location.search;
const _referrer    = document.referrer
  ? (() => { try { return new URL(document.referrer).hostname; } catch(e) { return document.referrer; } })()
  : 'direct';

// セッションストレージに流入元を保存（フォーム送信時に付与）
ssSet('fw_ref', _refSource);
if(_isPartner) ssSet('fw_partner', '1');

function fwTrack(){ /* No external analytics. Explicit survey RPC is separate. */ }

// ページビュー計測
fwTrack('page_view', { ref_source: _refSource, ref_medium: _refMedium, ref_campaign: _refCampaign, referrer: _referrer });

// Survey collection is handled separately by the explicit, consent-based Google adapter.

// ═══════════════════════════════════════════════════
// 14. 同意モーダル
// ═══════════════════════════════════════════════════
let _consentGiven = ssGet('fw_consent') === '1';

function showConsentModal() {
  document.getElementById('consentOverlay').classList.add('open');
  fwTrack('consent_modal_open');
}
function closeConsentModal() {
  document.getElementById('consentOverlay').classList.remove('open');
}

document.getElementById('consentCheck').addEventListener('change', function() {
  const btn = document.getElementById('consentOkBtn');
  btn.classList.toggle('enabled', this.checked);
  btn.disabled = !this.checked;
});

document.getElementById('consentOkBtn').addEventListener('click', () => {
  _consentGiven = true;
  ssSet('fw_consent', '1');
  closeConsentModal();
  fwTrack('consent_given');
  runSimulation();
});

document.getElementById('consentCancelBtn').addEventListener('click', closeConsentModal);
document.getElementById('consentOverlay').addEventListener('click', function(e) {
  if(e.target === this) closeConsentModal();
});

// シミュレーション実行（何度でも再実行可能）
// 数字のカウントアップ演出（押した瞬間の"山場"）
function _animNum(el, target, render, dur){
  if(!el) return;
  dur=dur||850; let t0=null;
  function step(now){
    if(t0===null) t0=now;
    const p=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-p,3);
    el.textContent=render(target*e);
    if(p<1) requestAnimationFrame(step); else el.textContent=render(target);
  }
  requestAnimationFrame(step);
}
function animateHero(){ /* Keep result values stable during editing. */ }
function runSimulation() {
  const btn = document.getElementById('runBtn');

  // 入力エラーがあればエラー箇所へスクロールして知らせる
  if(!validateAll()) {
    const errEl = document.querySelector('input.err');
    if(errEl) {
      // エラー入力が折りたたみ（健診データ）内で非表示なら自動展開してから案内
      if(errEl.offsetParent === null){
        const adv=document.getElementById('advancedInputs');
        if(adv && adv.style.display==='none'){ document.getElementById('advToggle').click(); }
      }
      setTimeout(()=>{ errEl.scrollIntoView({behavior:'smooth', block:'center'}); errEl.focus(); }, 60);
    }
    return;
  }

  // ボタンに実行中フィードバックを表示してから再計算
  btn.disabled = true;
  btn.textContent = '計算中...';
  setTimeout(() => {
    document.body.classList.remove('pre-run');   // 先に表示して幅を確定→グラフ等を正しいサイズで描画（押した瞬間に結果）
    window.dispatchEvent(new Event('scroll'));
    updateAll();
    // No survey or medical-data transmission is performed by the calculator.
    btn.disabled = false;
    btn.textContent = '入力した内容を確認する';
    // 結果の"数字"を画面中央に据えてスクロール（グラフでなく金額/年数）
    document.getElementById('simulationResults').scrollIntoView({behavior:'smooth',block:'start'});
    const _p1=document.getElementById('p1'); if(_p1){ _p1.classList.remove('revealed'); void _p1.offsetWidth; _p1.classList.add('revealed'); }
    animateHero();
    window.dispatchEvent(new Event('bp:simulation-complete'));
  }, 100);
}

// シミュレーションボタン：同意済みならそのまま実行、未同意なら同意モーダルを表示
document.getElementById('runBtn').addEventListener('click', () => {
  fwTrack('simulate_btn_click');
  if(_consentGiven) {
    runSimulation();
  } else {
    showConsentModal();
  }
});

// 改善シミュレーション（禁煙・運動習慣）トグル：チェックのたびに即座に再計算
['impQuitSmoke','impExercise'].forEach(id=>{
  const el=document.getElementById(id);
  el.addEventListener('change',()=>{
    document.getElementById(id+'Wrap').classList.toggle('checked',el.checked);
    fwTrack('improve_toggle',{id,checked:el.checked});
    updateAll();
  });
});

// 結果直後の「この変化を試す」から、推奨された改善条件を一押しで反映する
(function(){
  const btn=document.getElementById('tryImproveBtn');
  if(!btn)return;
  btn.addEventListener('click',()=>{
    const action=btn.dataset.improveAction;
    if(action==='quit'){
      const el=document.getElementById('impQuitSmoke');
      if(!el.disabled){el.checked=true;document.getElementById('impQuitSmokeWrap').classList.add('checked');}
    } else if(action==='exercise'){
      const el=document.getElementById('impExercise');
      if(!el.disabled){el.checked=true;document.getElementById('impExerciseWrap').classList.add('checked');}
    } else if(action==='weight'){
      document.getElementById('impWeightLoss').value='3';
    } else {
      return;
    }
    fwTrack('improve_try_click',{action});
    updateAll();
  });
})();

// 減量スライダー：ドラッグ中も即座に反映（触って試せるように）
document.getElementById('impWeightLoss').addEventListener('input',()=>{
  queueSimulationUpdate();
});
document.getElementById('impWeightLoss').addEventListener('change',()=>{
  fwTrack('improve_weight_slider',{kg:document.getElementById('impWeightLoss').value});
});
// 減量の −/＋ ボタン（ドラッグ不要で確実に調整できる）
(function(){
  const sl=document.getElementById('impWeightLoss');
  function step(d){
    if(!sl) return;
    const v=Math.max(0, Math.min(15, (parseInt(sl.value,10)||0)+d));
    sl.value=String(v);
    updateAll();
    fwTrack('improve_weight_btn',{kg:v});
  }
  const m=document.getElementById('impWeightMinus'), p=document.getElementById('impWeightPlus');
  if(m) m.addEventListener('click',()=>step(-1));
  if(p) p.addEventListener('click',()=>step(1));
})();
// STEP5（サービス紹介）：押したら開く／もう一度押すと閉じる
(function(){
  const btn=document.getElementById('step5Toggle');
  const body=document.getElementById('step5Body');
  if(!btn||!body) return;
  const main=btn.querySelector('.s5t-main');
  btn.addEventListener('click',()=>{
    const willOpen=body.hasAttribute('hidden');
    if(willOpen){ body.removeAttribute('hidden'); btn.setAttribute('aria-expanded','true'); if(main)main.textContent='継続サポート・サービスのご案内を閉じる'; }
    else{ body.setAttribute('hidden',''); btn.setAttribute('aria-expanded','false'); if(main)main.textContent='継続サポート・サービスのご案内を見る'; }
    try{ fwTrack('step5_toggle',{open:willOpen}); }catch(e){}
  });
})();

// ═══════════════════════════════════════════════════
// 15. 相談フォームモーダル
// ═══════════════════════════════════════════════════
function openConsultForm(pos, service) {
  fwTrack('cta_click', { cta_position: pos, service: service||'', ref_source: _refSource });
  // サービス選択をフォームの相談希望内容にプリセット
  const purposeMap = {
    'online':     'other',
    'harajuku-pt':'lifestyle_disease',
    'pilates':    'shoulder_back'
  };
  const sel = document.getElementById('f-purpose');
  if(service && purposeMap[service]) sel.value = purposeMap[service];
  document.getElementById('formOverlay').classList.add('open');
  document.getElementById('formSuccess').classList.remove('show');
  document.getElementById('consultForm').style.display = '';
  document.getElementById('formOverlay').scrollTop = 0;
}
function closeConsultForm() {
  document.getElementById('formOverlay').classList.remove('open');
}

document.getElementById('formCloseBtn').addEventListener('click', closeConsultForm);
document.getElementById('formOverlay').addEventListener('click', function(e) {
  if(e.target === this) closeConsultForm();
});

// CTA ボタン（トップ・中段・下部・スマホ追従）をまとめてバインド
document.querySelectorAll('[data-cta-pos]').forEach(btn => {
  btn.addEventListener('click', () => openConsultForm(btn.dataset.ctaPos, btn.dataset.service || ''));
});
// 予約（STORES）リンクのクリック計測
document.querySelectorAll('a[data-reserve]').forEach(a => {
  a.addEventListener('click', () => { try{ fwTrack('reserve_click', {service:a.dataset.reserve}); }catch(e){} });
});

// 下部固定CTA（二次健診受診勧奨）：STEP4（対策）へスクロール
document.getElementById('stickyCta').addEventListener('click', function(e){
  e.preventDefault();
  fwTrack('exam_cta_sticky_click');
  setTimeout(()=>{
    document.getElementById('step4').scrollIntoView({behavior:'smooth', block:'start'});
  }, 60);
});
// 結果の各行動ボタンを、保存・健診・改善・相談へ一貫してつなぐ
function goToPlanAction(action,source){
  fwTrack((source||'plan')+'_click',{action});
  if(action==='save'){ const save=document.getElementById('shareImgBtn'); if(save)save.click(); return; }
  if(action==='improve'){ const box=document.getElementById('improveBox'); if(box)box.scrollIntoView({behavior:'smooth',block:'center'}); return; }
  if(action==='exam'){ const details=document.getElementById('examDetails'); if(details)details.open=true; const box=document.getElementById('examCta'); if(box)box.scrollIntoView({behavior:'smooth',block:'start'}); return; }
  if(action==='support')openConsultForm(source||'next_plan','');
}
document.querySelectorAll('[data-next-action]').forEach(btn=>{
  btn.addEventListener('click',()=>goToPlanAction(btn.dataset.nextAction,'next_plan'));
});
// フォーム到達計測
document.getElementById('formOverlay').addEventListener('transitionend', function() {
  if(this.classList.contains('open')) {
    fwTrack('form_view');
  }
});

// フォーム送信
document.getElementById('consultForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('formSubmitBtn');
  btn.disabled = true;
  btn.textContent = '送信中...';

  const data = Object.fromEntries(new FormData(this));
  data.ref = ssGet('fw_ref') || 'direct';
  data.is_partner = ssGet('fw_partner') === '1';
  data.submitted_at = new Date().toISOString();

  fwTrack('form_submit', { purpose: data.purpose, partner_flow: data.is_partner });

  // ── フォーム送信先を設定してください ──────────────────────────
  // 例: Formspree → const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_ID';
  // 例: 自社API   → const FORM_ENDPOINT = '/api/counseling';
  const FORM_ENDPOINT = '';
  // ──────────────────────────────────────────────────────────────

  try {
    if(FORM_ENDPOINT) {
      await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      this.style.display = 'none';
      document.getElementById('formSuccess').classList.add('show');
      fwTrack('form_complete', { purpose: data.purpose });
    } else {
      // 送信先未設定：偽りの受付をしない。個人情報は端末にも保存しない（本番前にFORM_ENDPOINTを設定）
      btn.disabled = false;
      btn.textContent = '送信する — 無料カウンセリングを申し込む';
      alert('現在オンライン受付を準備中です。恐れ入りますが、会場スタッフにお声がけいただくか、記載の窓口までご連絡ください。（この内容は送信・保存されていません）');
    }
  } catch(err) {
    btn.disabled = false;
    btn.textContent = '送信する — 無料カウンセリングを申し込む';
    alert('送信中にエラーが発生しました。お手数ですがしばらくしてから再度お試しください。');
  }
});

// 結果まとめカードを「1枚の画像」として生成・保存（携帯でも最良の形）
let exportRendererPromise;
function ensureExportRenderer(){
 if(typeof window.html2canvas==='function')return Promise.resolve();
 if(!exportRendererPromise)exportRendererPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='assets/vendor/html2canvas-1.4.1.min.js';script.async=true;
  script.onload=()=>resolve();script.onerror=()=>{script.remove();exportRendererPromise=null;reject(Error('画像出力機能を読み込めませんでした。'));};document.head.append(script);
 });return exportRendererPromise;
}
async function saveResultAsImage(btn, note){
  fwTrack('save_image_click');

  const card=document.getElementById('reportA4');
  const orig = btn ? btn.innerHTML : null;
  if(btn){ btn.disabled=true; btn.textContent='画像を作成中...'; }
  try{
    await ensureExportRenderer();
    if(document.fonts) await document.fonts.ready;
    // A4レポートを高解像度で1枚に（白背景・794×1123px＝A4縦比）
    const scale = Math.min(3, Math.max(2, (window.devicePixelRatio||1)*1.5));
    const canvas = await html2canvas(card, {
      backgroundColor:'#ffffff', scale, useCORS:true, logging:false,
      width:794, windowWidth:794
    });
    const link=document.createElement('a');
    link.download='body-palette-健診結果の確認.png';
    link.href=canvas.toDataURL('image/png');
    link.click();
    fwTrack('save_image_success');
    if(note) note.textContent='画像を作成しました。ダウンロード先はブラウザ・端末の設定をご確認ください。';
  }catch(e){
    if(note) note.textContent='画像の生成に失敗しました。しばらくしてから再度お試しください。';
  }finally{
    if(btn){ btn.disabled=false; btn.innerHTML=orig; }
  }
}

// カード下の画像保存ボタン（全デバイス共通）
document.getElementById('shareImgBtn').addEventListener('click',()=>{
  saveResultAsImage(document.getElementById('shareImgBtn'), document.getElementById('shareImgNote'));
});

// PDF/印刷ボタン：PC＝印刷ダイアログ、スマホ＝1枚画像を生成（印刷は携帯だと扱いにくいため）
document.getElementById('pdfBtn').addEventListener('click',()=>{
  if(window.innerWidth<=768){
    fwTrack('pdf_btn_mobile_to_image');
    saveResultAsImage(document.getElementById('pdfBtn'), null);
  } else {
    fwTrack('pdf_print_click');
    window.print();
  }
});
// スマホではPDF/印刷ボタンの文言を「画像で保存」に合わせる
if(window.innerWidth<=768){
  const pb=document.getElementById('pdfBtn');
  if(pb) pb.innerHTML='<span class="pdf-btn-icon">📷</span> この結果を画像で保存する';
}

// 詳細入力トグル
document.getElementById('advToggle').addEventListener('click',function(){
  const adv=document.getElementById('advancedInputs');
  const isOpen=adv.style.display!=='none';
  adv.style.display=isOpen?'none':'';
  this.classList.toggle('open',!isOpen);
  this.querySelector('.adv-toggle-icon').textContent=isOpen?'＋':'−';
  fwTrack(isOpen?'advanced_close':'advanced_open');
});

document.getElementById('discToggle').addEventListener('click',()=>{
  const d=document.getElementById('discDetail');
  d.classList.toggle('open');
  document.getElementById('discToggle').textContent=
    d.classList.contains('open')?'▲ 閉じる':'▼ 引用元・詳細を見る';
});

// デモ用サンプル入力（司会が壇上で"効く"結果をすぐ出す。?demo=1 / ?present=1 でボタン表示）
function fillDemo(){
  if(_lsMode==='unselected')setMode('asset');
  const set=(id,v)=>{const e=document.getElementById(id); if(e){e.value=v;}};
  set('gender','male'); set('age','52'); set('habit','none'); set('smoking','current'); set('cigCount','20');
  set('income','500'); set('assets','800');
  const adv=document.getElementById('advancedInputs');
  if(adv && adv.style.display==='none'){ document.getElementById('advToggle').click(); }
  set('height','170'); set('weight','88'); set('waist','94'); set('sbp','145'); set('dbp','92');
  set('ldl','160'); set('hdl','42'); set('tg','180'); set('glucose','118'); set('hba1c','6.3');
  set('ast','30'); set('alt','40'); set('ggt','80');
  try{ if(typeof updateCigCountVisibility==='function') updateCigCountVisibility(); }catch(e){}
  try{ if(typeof updateMetsBanner==='function') updateMetsBanner(); }catch(e){}
  try{ if(typeof updatePrecisionMeter==='function') updatePrecisionMeter(); }catch(e){}
  runSimulation();
}
// リセット（複数回デモの間に初期化）
function resetForm(){
  const f=id=>document.getElementById(id);
  if(f('gender'))f('gender').value='male'; if(f('age'))f('age').value='40';
  if(f('habit'))f('habit').value='none'; if(f('smoking'))f('smoking').value='never';
  ['cigCount','income','assets','height','weight','waist','sbp','dbp','ldl','hdl','tg','glucose','hba1c','ast','alt','ggt'].forEach(id=>{ if(f(id)) f(id).value=''; });
  const adv=f('advancedInputs'); if(adv && adv.style.display!=='none'){ f('advToggle').click(); }
  try{ if(typeof updateCigCountVisibility==='function') updateCigCountVisibility(); }catch(e){}
  try{ if(typeof updateMetsBanner==='function') updateMetsBanner(); }catch(e){}
  try{ if(typeof updatePrecisionMeter==='function') updatePrecisionMeter(); }catch(e){}
  document.body.classList.add('pre-run');
  clearMode();
  try{ updateAll(); }catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
}
(function(){
  const d=document.getElementById('demoFillBtn'); if(d) d.addEventListener('click',fillDemo);
  const r=document.getElementById('resetFormBtn'); if(r) r.addEventListener('click',resetForm);
  const p=new URLSearchParams(location.search);
  if((p.has('demo')||p.has('present'))&&d) d.style.display='';
})();

// STEP2で健診値を確認し、STEP3で取り組みたいことを整理します。

// 初期化
document.body.classList.add('pre-run');   // 実行前は結果を隠す（押した瞬間に出す・他人の既定値結果を見せない）
clearMode();
updateAll();
resetPanels();
