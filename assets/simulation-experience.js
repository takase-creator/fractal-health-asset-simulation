/* Clear separation between study observations, proprietary scores, and scenario assumptions. */
function describeScenarioChanges(state,overrides,weight){
 const changes=[];
 if(overrides.smoking)changes.push('喫煙：現在喫煙 → 禁煙を継続');
 if(overrides.exerciseHoursPerWeek!==undefined)changes.push(`運動：週${Math.round(state.exerciseHours*60)}分 → 週${Math.round(overrides.exerciseHoursPerWeek*60)}分（30分×3回）`);
 if(overrides.weightLossKg)changes.push(`体重：${weight}kg → ${Math.round((weight-overrides.weightLossKg)*10)/10}kg（−${overrides.weightLossKg}kg）`);
 return changes;
}
if(typeof module!=='undefined'&&module.exports){module.exports={describeScenarioChanges};}else{
(function(){
 const $=id=>document.getElementById(id);
 const warning=document.createElement('p');warning.id='simulationInputError';warning.hidden=true;warning.setAttribute('role','alert');warning.className='simulation-input-error';$('runBtn').before(warning);
 const box=document.createElement('div');box.className='result-reading-order mode-asset-only';box.id='resultReadingOrder';
 box.innerHTML='<p class="result-summary-note">独自モデルによる参考試算です。比較対象・計算条件を確かめてから、生活習慣の条件を変えてみてください。</p><details id="comparisonDetails"><summary>比較対象を確認する</summary><div id="comparisonValues" class="comparison-values"></div><p>比較基準は、モデルの追加医療費・収入減をゼロとした仮定です。健康な人の実際の将来資産や、生活習慣を改善した結果を保証する基準ではありません。</p></details><details id="resultAssumptions"><summary>計算条件と、含めていないものを確認する</summary><dl id="resultAssumptionValues" class="assumption-values"></dl><p>費用・収入減・生活費は利用者が確認・変更できる仮定です。高額療養費、健保の付加給付、税、通院交通費、待ち時間、入力した運動費用以外は自動反映していません。</p><button type="button" id="editAssumptions">試算条件を変更する</button></details>';
 $('age80box').after(box);
 const oldNote=box.nextElementSibling;if(oldNote?.classList.contains('model-note'))oldNote.hidden=true;
 // Keep detailed model disclosures at the end of the page.
 document.querySelector('.disclaimer').after(box);
 const loss=document.querySelector('.loss-summary');if(loss){box.append(loss);loss.querySelector('summary').textContent='詳しい損失内訳を見る';}
 $('editAssumptions').addEventListener('click',()=>{const toggle=$('step2')?.querySelector('.step-accordion-toggle');if(toggle?.getAttribute('aria-expanded')==='false')toggle.click();$('economicAssumptions').open=true;requestAnimationFrame(()=>{$('economicAssumptions').scrollIntoView({behavior:'smooth',block:'center'});$('currentCostAssumption').focus({preventScroll:true});});});
 const title=$('riskTitle');const tag=document.createElement('span');tag.className='basis-tag score';tag.textContent='独自スコア';title.prepend(tag);
 const trend=document.querySelector('.trend-box');if(trend){const b=document.createElement('p');b.className='basis-heading';b.innerHTML='<span class="basis-tag study">研究データ</span>研究対象の集団で報告された割合・比較指標';trend.prepend(b);}
 const model=document.createElement('span');model.className='basis-tag model';model.textContent='独自の資産モデル';$('age80box').prepend(model);
 const lifeTag=model.cloneNode(true);lifeTag.textContent='研究集団の観察値';$('lifespanResult').prepend(lifeTag);
 const guide=document.createElement('section');guide.className='basis-guide';guide.setAttribute('aria-label','3種類の数値の読み方');guide.innerHTML='<h3>3種類の数値を分けて読みます</h3><dl><div><dt>研究データ</dt><dd>研究に参加した集団の発症割合やHR。個人の確率・改善効果とは異なります。</dd></div><div><dt>独自スコア</dt><dd>入力値や習慣を整理する0〜100の指標。%や倍率へは変換しません。</dd></div><div><dt>独自の試算モデル</dt><dd>入力条件と仮定に基づくシナリオ比較。個人の寿命・資産の予測精度は未検証です。</dd></div></dl>';
 const references=$('discDetail');
 if(references){if(trend)references.append(trend);references.append(guide);}
 if(window.BPResearch){const background=BPResearch.createDetails(['li2020','hackshaw2018'],'生活習慣・健康年数・喫煙の研究を見る（2本）');background.classList.add('research-background');guide.after(background);}
 const summary=document.createElement('div');summary.id='selectedChanges';summary.className='selected-changes';summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');
 $('improveToggles').after(summary);
 const reset=document.createElement('button');reset.type='button';reset.id='resetScenario';reset.className='scenario-reset';reset.textContent='変更条件をすべて解除';summary.after(reset);
 reset.addEventListener('click',()=>{['impQuitSmoke','impExercise'].forEach(id=>{$(id).checked=false;$(id+'Wrap').classList.remove('checked');});$('impWeightLoss').value='0';updateAll();});
 const caution=document.createElement('p');caution.className='scenario-caution';caution.textContent='選んだ習慣を長期間継続する仮定で再計算します。実際の効果や、変化にかかる期間を示すものではありません。減量・治療・運動量の変更を勧める判定ではありません。';reset.after(caution);
 $('impWeightLoss').setAttribute('aria-label','試算する体重の減少量');$('impWeightLoss').setAttribute('aria-describedby','impWeightNote');
 // Update the UI only from the same state used for the chart and the result.
 window.renderExperience=function(state,sim,alt,overrides){
   const values=$('comparisonValues');values.replaceChildren();
   for(const [label,value] of [['現在の条件を続ける想定（赤）',sim.red80],['比較基準：追加負担なし（青）',sim.blue80]]){
     const item=document.createElement('div');const t=document.createElement('span');t.textContent=label;const v=document.createElement('strong');v.textContent=(value<0?'−':'')+fmt(Math.abs(value));item.append(t,v);values.append(item);
   }
   const pairs=[['年齢と期間',`${state.age}歳から80歳まで（${80-state.age}年間）`],['年収',n('income')!==null?`${n('income')}万円（入力値）`:'未入力：年齢・性別別の平均に基づく仮定'],['現在の総資産',n('assets')!==null?`${n('assets')}万円（入力値）`:'未入力：0万円として試算'],['運用利回り','年率3%（独自の仮定・保証なし）'],['モデル医療費の本人負担',`${n('medicalShare')??30}%（仮定）`],['健康による収入減',`${n('incomeLossAssumption')||0}%（仮定）`],['退職・年金','60歳で再雇用・65歳で年金移行を仮定']];
   $('resultAssumptionValues').replaceChildren();for(const [k,v] of pairs){const dt=document.createElement('dt');dt.textContent=k;const dd=document.createElement('dd');dd.textContent=v;$('resultAssumptionValues').append(dt,dd);}
   const changes=describeScenarioChanges(state,overrides,n('weight'));const holder=$('selectedChanges');holder.replaceChildren();
   const heading=document.createElement('strong');heading.textContent=changes.length?'今回変更した条件':'条件を選ぶと、比較結果を表示します。';holder.append(heading);
   for(const text of changes){const chip=document.createElement('span');chip.className='change-chip';chip.textContent=text;holder.append(chip);}
   if(changes.length&&alt){
     const text=document.createElement('p');text.className='change-outcome';
     const label=document.createElement('span');label.className='change-outcome-label';
     const value=document.createElement('strong');value.className='change-outcome-value';
     const note=document.createElement('span');note.className='change-outcome-note';
     if(document.body.dataset.mode==='lifespan'){
       const before=computeLifespan(state),after=computeLifespan(alt);label.textContent='現在の条件との年数差';value.textContent='個人の年数差は算定できません';note.textContent='複数習慣による研究集団の比較';
     }else{const after=projectImproved(alt);const d=after.val80-sim.red80;label.textContent='現在の条件との資産差額';value.textContent=`${d<0?'−':'+'}${fmt(Math.abs(d))}`;note.textContent='80歳時点・独自モデルによる参考試算';}
     text.append(label,value,note);
     holder.append(text);
   }
   $('resetScenario').disabled=changes.length===0;
   ['impQuitSmoke','impExercise'].forEach(id=>$(id+'Wrap').classList.toggle('checked',$(id).checked&&!$(id).disabled));
   $('impExerciseWrap').querySelector('label')?.setAttribute('title','30分×週3回＝週90分の設定例');
   $('legendImproved').textContent='選んだ変更条件を継続（緑）';
 };
 // Values are recalculated after valid changes; no stale result from before an input edit.
 const ids=['gender','age','habit','smoking','income','assets',...Object.keys(RULES)];
 for(const id of new Set(ids)){const el=$(id);if(!el)continue;el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>{const valid=el.checkValidity();el.setAttribute('aria-invalid',String(!valid));updateAll();});}
 updateAll();
})();
}
