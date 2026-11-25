/* Make the revised basis visible in the original result/graph/scenario/report flow. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const money=v=>(v<0?'−':'')+fmt(Math.abs(Math.round(v)));
 const fields=['currentCostAssumption','changedCostAssumption','exerciseCostAssumption','changedLossAssumption','savingAssumption','retireAssumption','pensionAssumption','livingAssumption','returnAssumption'];
 fields.forEach(id=>$(id).addEventListener('input',()=>updateAll()));
 $('financialExample').addEventListener('click',()=>{for(const [id,v]of [['currentCostAssumption',20],['changedCostAssumption',10],['exerciseCostAssumption',3]])$(id).value=v;$('financialExampleNote').hidden=false;updateAll();});
 const fasting=document.createElement('div');fasting.className='field';fasting.innerHTML='<label for="fastingCondition">中性脂肪の採血条件</label><select id="fastingCondition"><option value="unknown">不明</option><option value="fasting">空腹時（10時間以上絶食）</option><option value="nonfasting">随時（食後）</option></select>';$('tg').closest('.field').after(fasting);$('fastingCondition').addEventListener('change',()=>updateAll());
 const method=$('roiFormula');method.innerHTML='<summary>金額の計算式・費用条件を見る</summary><p>80歳時点の差額 ＝ 変更後の年間費用・収入減を設定した資産 − 現在条件の資産。変更後の運動費用も年額で差し引きます。</p><p>30分1回の換算額 ＝ 上の差額（円）÷［（80 − 現在年齢）×52週×3回］。丸め前の金額で計算します。生涯の仮定を回数で割った参考値であり、運動1回の医療効果・収益ではありません。</p><button type="button" id="editExerciseCosts">現在・変更後の費用条件を編集する</button>';
 $('editExerciseCosts').addEventListener('click',()=>{const section=$('step2Section');const toggle=section.querySelector('.step-accordion-toggle');if(toggle?.getAttribute('aria-expanded')==='false')toggle.click();$('economicAssumptions').open=true;$('economicAssumptions').scrollIntoView({block:'start'});$('changedCostAssumption').focus({preventScroll:true});});
 const notices=document.createElement('div');notices.id='screeningNotices';notices.setAttribute('role','status');$('riskTitle').after(notices);
 document.querySelector('.life-main-label').textContent='研究集団で報告された、疾患のない余命の差';
 document.querySelector('#lifespanResult > .basis-tag').textContent='研究の観察値';
 document.querySelector('.life-live-change-label').textContent='選んだ習慣と、この研究で言えること';
 document.querySelectorAll('.life-mini-u').forEach(e=>e.textContent='年（50歳から）');
 document.querySelectorAll('.mode-select-card').forEach(e=>{const text=e.textContent;if(text.includes('健康寿命'))e.setAttribute('aria-label','研究集団の健康年数を比べる');});
 const riskNote=document.createElement('p');riskNote.className='reviewed-note';riskNote.textContent='公的な健診判定値との照合を主に表示します。独自参考ポイントは過去のアンケート集計との連続性のため残していますが、医学的な高・中・低の分類ではありません。資産・健康年数の計算には使いません。';$('riskTitle').after(riskNote);
 const p=$('improveSub');p.after(Object.assign(document.createElement('p'),{className:'reviewed-note',textContent:'生活習慣の選択だけで費用・健診値が変わるとは仮定しません。資産比較には、ご自身で設定した「変更後の費用・収入減」を使います。'}));
 function write(id,text){if($(id))$(id).textContent=text;}
 window.renderReviewedModel=function(s,sim,alt){
  const a=economicInputs(),checks=BPClinical.evaluate(Object.fromEntries(Object.keys(BPClinical.rules).map(id=>[id,n(id)])),$('fastingCondition').value);
  const rows=[...$('riskRows').children];['glucose','bp','lipid','liver','kidney','musculo'].forEach((k,i)=>{
   const card=rows[i],r=checks.areas[k];if(!card)return;card.dataset.level=r.level;
   card.querySelector('.risk-lv').textContent=r.label;card.querySelector('.risk-lv').style.background={unknown:'#737c7c',low:'#0f9894',mid:'#c67b31',high:'#c53765'}[r.level];
   card.querySelector('.risk-score').textContent='独自参考 '+s.risks[k]+'/100';
   card.querySelector('.risk-improved')?.remove();
   card.querySelectorAll('.reviewed-clinical').forEach(e=>e.remove());const note=document.createElement('p');note.className='reviewed-clinical';note.textContent=r.total?r.items.map(v=>v.value===null?v.label+'：未入力':v.label+' '+v.value+v.unit+'：'+(v.conditionUnknown?'採血条件を確認':BPClinical.labels[v.level])).join(' ／ '):k==='kidney'?'eGFR・尿蛋白がないため、腎機能は評価できません。':'診察や機能検査がないため、疾患リスクは評価できません。';card.querySelector('.risk-row-main').append(note);
  });
  notices.replaceChildren(...checks.notices.map(t=>Object.assign(document.createElement('p'),{textContent:t})));
  write('riskTitle','6領域の健診値・確認事項');const riskDescription=$('riskTitle').parentElement.querySelector('.risk-disclaimer');if(riskDescription)riskDescription.textContent='健診判定値との照合と独自参考ポイントは別の指標です。';
  write('a80diffBig',money(-sim.diff80));write('a80diffCalc',fmt(Math.abs(Math.round(sim.diff80))));
  write('a80good',money(sim.blue80));write('a80bad',money(sim.red80));write('a80op','−');
  write('a80badLabel','入力した年間費用・収入減あり');
  write('a80mainSub',a.cost===0&&a.loss===0?'追加費用・収入減を0と置いたため比較線と一致しています。健康に問題がないという判定ではありません。':'入力した費用・収入減による差額です。健診値から医療費を予測した金額ではありません。');
  write('improveSub','取り組みたい習慣を選び、設定した費用条件による資産の差を確認します。');
  write('improveTryDesc','選んだ習慣を記録し、入力した変更後の費用条件で比較します。年数の効果は算定しません。');
  if(alt){
   write('impRiskLabel','独自参考ポイント（効果予測ではない）');
   if(document.body.dataset.mode==='lifespan'){
    write('impOutcomeLabel','個人の健康年数の変化');write('impGood','算定できません');write('impDiffLabel','運動単独の延伸年数');write('impDiff','算定できません');
    const value=$('selectedChanges').querySelector('.change-outcome-value');if(value)value.textContent='個人の年数差は算定できません';
    const note=$('selectedChanges').querySelector('.change-outcome-note');if(note)note.textContent='研究は複数の生活習慣をまとめた集団比較です。';
   }else{
    write('impOutcomeLabel','変更後の費用条件での80歳資産');write('impDiffLabel','現在条件との差（費用の仮定）');write('impGood',money(projectImproved(alt).val80));
   }
  }
  write('legendImproved','変更後の費用条件（緑）');
  const list=$('resultAssumptionValues');list.replaceChildren();
  for(const [label,v]of [['年収',a.income+'万円'+(n('income')===null?'（未入力：仮例）':'（入力値）')],['現在の追加費用',a.cost+'万円/年'],['変更後の追加費用',a.changedCost+'万円/年'],['変更後の運動費用',a.exerciseCost+'万円/年'],['現在／変更後の収入減',(a.loss*100)+'% ／ '+(a.changedLoss*100)+'%'],['資産に回す割合',(a.saving*100)+'%（年収に対する仮定）'],['退職・年金',a.retire+'歳で切替、年手取り'+a.pension+'万円'],['退職後の生活費',a.living+'万円/年'],['運用利回り',(a.rate*100)+'%/年（保証なし）']]){list.append(Object.assign(document.createElement('dt'),{textContent:label}),Object.assign(document.createElement('dd'),{textContent:v}));}
  write('lossPT',money(-sim.cumulativePT));write('lossMed',money(-sim.cumulativeMed));write('lossComp',money(-sim.compoundLoss));write('lossTotal',money(-sim.diff80));
  const summary=$('scHlSub');summary.textContent='費用条件から計算した家計比較です。健診値や独自ポイントを金額・個人の延伸年数へ換算していません。';write('scHlPre','入力した費用条件による80歳の資産差額');write('scHlNum',money(-sim.diff80));
 };
 const original=window.updateAll;
 window.updateAll=function(...args){
  if([...fields,'income','assets',...Object.keys(RULES)].some(id=>!$(id).checkValidity())){$('simulationInputError').hidden=false;$('simulationInputError').textContent='費用条件の入力範囲を確認してください。結果は直前の条件のままです。';return;}
  const out=original.apply(this,args);
  if(!invalidPressure()){
   const s=computeRisk(),sim=simulate(s);const alt=['impExercise','impQuitSmoke'].some(id=>$(id).checked)||Number($('impWeightLoss').value)>0?{...s,scenarioChanged:true}:null;
   renderReviewedModel(s,sim,alt);
   write('a80mainLabel','80歳時点の資産差額（費用の仮定）');
   write('assetDifferenceBasis','入力した費用条件 − 追加費用ゼロの比較線');
   write('resultMissingNote','未入力の健診項目は評価できません。費用・家計の初期値は説明用の仮定で、ご自身の収支に合わせて変更してください。');
   write('roiSessionValue',fmtYen(computeExerciseValue(s,sim).perSessionYen));
  }return out;
 };
 function invalidPressure(){return $('sbp').value!==''&&$('dbp').value!==''&&n('sbp')<=n('dbp');}
 const report=window.renderReportA4;
 window.renderReportA4=function(s,sim,life){
  report(s,sim,life);const riskHead=document.querySelector('#reportA4 .ra-risk-title');if(riskHead)riskHead.textContent='独自参考ポイント（医学的な疾患分類ではありません）';const isLife=document.body.dataset.mode==='lifespan',a=economicInputs();
  if(isLife){
   write('raTitle','研究集団の疾患のない余命');write('raHeroLabel','Li 2020：50歳からの3疾患のない余命');write('raFmLL','4〜5項目群');write('raFmLV',life.maintainRemain+'年');write('raFmRL','0項目群');write('raFmRV',life.neglectRemain+'年');write('raFmDL','論文で報告された群間差');write('raFmDV',life.loss+'年');
   write('raDetailT','個人の寿命・行動単独の効果ではありません');$('raDetail').textContent='95%信頼区間：群間差 '+life.ci+'年。上位群 '+life.highCI+'年、0項目群 '+life.lowCI+'年。群の平均値と差は論文の丸め前の値で計算されるため、表示値の単純な差とずれる場合があります。';
   write('raFoot','Li et al., BMJ 2020 表2。米国の医療従事者。糖尿病・心血管疾患・がんのない余命で、日本の健康寿命とは定義が異なります。個人の余命や運動だけの効果を予測しません。https://pmc.ncbi.nlm.nih.gov/articles/PMC7190036/');
  }else{
   write('raFmDL','現在の費用条件 − 追加費用ゼロの比較線');write('raFmDV',money(-sim.diff80));write('raDetailT','差額の内訳（合計と一致、丸め差を除く）');
   $('raDetail').innerHTML='<p>追加費用累計：'+money(sim.cumulativeMed)+' ／ 収入減累計：'+money(sim.cumulativePT)+' ／ 運用益の差：'+money(sim.compoundLoss)+'</p>';
   write('raFoot',`家計の仮定：年収${a.income}万円、追加費用${a.cost}万円/年、収入減${a.loss*100}%、資産に回す割合${a.saving*100}%、退職${a.retire}歳、退職後手取り${a.pension}万円/年、生活費${a.living}万円/年、利回り${a.rate*100}%。未入力は画面の仮例。健診値から医療費を予測しません。税・物価・借入利息は計算対象外。`);
  }
 };
 document.querySelectorAll('.restored-model-note').forEach(e=>e.textContent='健診値は公的な判定値に照合。資産は入力した費用条件で比較し、健康年数は研究集団の観察値を表示します。');
 const css=document.createElement('style');css.textContent='.reviewed-note,.reviewed-clinical{font-size:12px;line-height:1.6;margin:6px 0}.reviewed-clinical{width:100%;grid-column:1/-1}#screeningNotices p{background:#fff0f4;border-left:4px solid #c53765;padding:9px;font-weight:700}#economicAssumptions .field{margin:4px 0}#economicAssumptions .fg2{gap:8px}#financialExample,#editExerciseCosts{border:1px solid #148e88;background:#effaf8;color:#146c68;padding:10px 14px;font-weight:700;cursor:pointer}.risk-row[data-level=unknown]{background:#f2f4f4!important}.life-live-change strong{font-size:clamp(17px,3vw,25px)}';document.head.append(css);
 const modeLife=$('modeLife');modeLife.querySelector('strong')&&(modeLife.querySelector('strong').textContent='研究の健康年数を比べる');
 document.querySelector('.hero-copy>p').innerHTML='健診値を確認し、将来の家計を条件別に比較。<br>健康年数は、論文で報告された集団の違いを確認できます。';
 const guide=document.querySelector('.basis-guide');if(guide)guide.querySelector('h3').textContent='健診判定値・研究値・家計の仮定を分けて確認';
 const assumptions=$('resultAssumptions');assumptions.querySelector('p').textContent='健診値から医療費・収入減を自動算出しません。高額療養費や付加給付は自動反映しないため、利用者が想定する本人負担額で入力してください。運動費用は変更後条件の年額に加算します。';
 $('resultMethod').querySelectorAll('p')[1].textContent='費用・収入減は入力値から計算。未入力年収500万円などは説明用の仮定です。健康年数は米国研究集団の観察値で、個人の延伸年数は算定しません。';
 updateAll();
})();
