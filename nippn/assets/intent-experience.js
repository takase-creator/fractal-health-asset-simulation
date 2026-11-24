/* Result-first experience. Calculation functions and input data stay intact. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const result=$('p1'),body=result?.querySelector(':scope > .pb');
 if(!body)return;
 // Remove the introductory guide after all calculator inputs have moved out.
 $('p0')?.remove();
 document.querySelector('.step-nav-item[href="#step1"]')?.remove();
 const visibleSteps=['step2Section','step3','nextPlan','seminarSurvey'];
 visibleSteps.forEach((id,index)=>{const badge=$(id)?.querySelector('.ph-step');if(badge)badge.textContent='STEP '+(index+1);});
 document.querySelectorAll('.step-nav-item').forEach((link,index)=>{link.dataset.step=String(index+1);link.querySelector('.sn-num').textContent='STEP '+(index+1);});
 if($('surveyStepLink'))$('surveyStepLink').textContent='STEP 4 アンケートへ進む';
 function redirectRetiredGuide(){if(location.hash==='#step1')location.replace('#step2');}
 window.addEventListener('hashchange',redirectRetiredGuide);redirectRetiredGuide();

 // Show the existing graph first, then the large asset result and comparison amounts.
 const asset=$('age80box'),life=$('lifespanResult'),graph=result.querySelector('.graph-wrap');
 body.prepend(graph);graph.after(asset);asset.after(life);
 const differenceBasis=document.createElement('p');differenceBasis.id='assetDifferenceBasis';differenceBasis.className='intent-difference-basis';differenceBasis.textContent='現在の条件 − 比較基準';$('a80mainLabel').after(differenceBasis);
 const heading=$('simulationResults');
 heading.setAttribute('tabindex','-1');
 const pairWarning=document.createElement('p');pairWarning.id='bloodPressurePairWarning';pairWarning.className='intent-pair-warning';pairWarning.hidden=true;pairWarning.setAttribute('role','alert');$('dbp').closest('.field').after(pairWarning);
 function invalidPressurePair(){const a=$('sbp').value,b=$('dbp').value;return a!==''&&b!==''&&Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Number(a)<=Number(b);}
 function showPairWarning(){pairWarning.hidden=!invalidPressurePair();pairWarning.textContent=pairWarning.hidden?'':'上の血圧が下の血圧以下になっています。上下の欄と数値を確認してください。直すまで結果は更新しません。';return !pairWarning.hidden;}
 $('runBtn').addEventListener('click',event=>{if(showPairWarning()){event.preventDefault();event.stopImmediatePropagation();$('sbp').focus();}},{capture:true});
 const tools=document.createElement('div');tools.className='intent-result-tools';tools.setAttribute('role','group');tools.setAttribute('aria-label','表示するシミュレーション結果');
 tools.innerHTML='<button type="button" id="resultAsset">健康資産を見る</button><button type="button" id="resultLife">健康年数を見る</button>';
 heading.after(tools);
 $('resultAsset').addEventListener('click',()=>$('modeAsset').click());
 $('resultLife').addEventListener('click',()=>$('modeLife').click());
 const context=document.createElement('section');context.id='resultInputContext';context.className='intent-input-context';context.setAttribute('aria-label','この結果の入力条件');
 context.innerHTML='<p id="sampleDataNote" class="intent-sample-note" hidden>サンプル入力を起点にしています。ご自身のデータか確認してください。</p><h3>この結果の入力条件</h3><dl id="resultInputList"></dl><p id="resultMissingNote"></p><p class="intent-auto-note">結果表示後は、入力や比較条件の変更に合わせて再計算します。</p>';
 const method=document.createElement('details');method.className='intent-method';method.id='resultMethod';method.innerHTML='<summary>比較対象と計算条件を確認する</summary><p>比較基準は、このモデルで追加負担がないと置いた条件です。現在の条件との違いを、同じ計算期間・運用等の仮定で比較しています。</p><p>年収・資産を入れていない場合はモデルの初期設定を使います。医療費・収入減・運用・健康年数の換算には独自の仮定があり、個人予測としての精度は検証されていません。</p><a href="#economicAssumptions">資産試算の仮定を確認・変更する →</a>';
 const chartSummary=document.createElement('p');chartSummary.id='chartTextSummary';chartSummary.className='intent-chart-summary';graph.append(chartSummary);$('chart').setAttribute('aria-describedby','chartTextSummary');$('chart').setAttribute('aria-label','現在の年齢から80歳までの資産推移を比較する参考グラフ。比較結果は下の金額、計算した条件は下の一覧で確認できます。');
 const inputDetails=document.createElement('details');const inputSummary=document.createElement('summary');inputSummary.textContent='この結果の入力条件を確認';inputDetails.append(inputSummary);for(const child of [...context.children])if(child.id!=='sampleDataNote')inputDetails.append(child);context.append(inputDetails);
 life.after(context);context.after(method);
 method.querySelector('a').addEventListener('click',()=>{$('economicAssumptions').open=true;});
 const notice=document.querySelector('.restored-model-note');
 if(notice){notice.textContent='独自の仮定による比較です。将来の実額・寿命・運動効果の予測ではありません。';method.insertAdjacentHTML('beforeend','<p>結果を医学的な診断や受診の代わりに使わず、健診票・主治医の案内を確認してください。</p>');}
 const scenario=document.createElement('p');scenario.id='scenarioInputNote';scenario.className='intent-scenario-note';$('selectedChanges').after(scenario);
 const reset=$('resetScenario');if(reset)reset.setAttribute('aria-label','比較で変更した条件だけを元に戻す');
 const mainButton=$('runBtn');const refreshButton=()=>{if(!mainButton.disabled&&!document.body.classList.contains('pre-run')&&mainButton.textContent!=='この条件で再計算する')mainButton.textContent='この条件で再計算する';};new MutationObserver(refreshButton).observe(mainButton,{childList:true});
 const running=document.createElement('p');running.id='resultReadyStatus';running.className='intent-sr-status';running.setAttribute('role','status');running.setAttribute('aria-live','polite');result.prepend(running);
 let previouslyRun=false,lastMode='';
 function appendPair(dl,label,value){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;dl.append(dt,dd);}
 function selected(id){const e=$(id);return e?.selectedOptions?.[0]?.textContent||'';}
 function clarifyClinicalBanner(){
  const title=$('metsBannerTitle'),desc=$('metsBannerDesc');
  if(title)title.textContent='体格・血圧・血糖の入力を確認してください';
  if(desc)desc.textContent='モデル内の入力区分です。診断や特定保健指導の対象者判定ではありません。健診票と専門職の案内を確認してください。';
 }
 const reportRenderer=window.renderReportA4;
 if(typeof reportRenderer==='function')window.renderReportA4=function(...args){
  const out=reportRenderer.apply(this,args);if($('raMsg'))$('raMsg').innerHTML=$('raMsg').innerHTML.replace(/STEP 3/g,'STEP 2');const isLife=document.body.dataset.mode==='lifespan';
  $('raTitle').textContent=isLife?'健康年数の参考シナリオ':'健康資産の参考シナリオ';
  $('raFmDL').textContent=isLife?'現在の条件 − 比較基準（年数差）':'現在の条件 − 比較基準（80歳時点）';
  const value=$('raFmDV');if(value&&!value.textContent.startsWith('−')&&!/^0(?:年|万円)/.test(value.textContent))value.textContent='−'+value.textContent;
  return out;
 };
 function render(){
  clarifyClinicalBanner();
  const recovered=context.classList.contains('is-stale');
  const validationIds=['height','weight','waist','sbp','dbp','ldl','hdl','tg','glucose','hba1c','ast','alt','ggt','income','assets','medicalShare','incomeLossAssumption'];
  if(validationIds.some(id=>$(id)&&!$(id).checkValidity())){context.classList.add('is-stale');running.textContent='入力内容を修正してください。結果と入力条件の一覧は、直前の有効な条件のままです。';return;}
  context.classList.remove('is-stale');
  // Presentation follows the existing label; scoring and thresholds are unchanged.
  $('riskRows').querySelectorAll('.risk-row').forEach(card=>{
   const label=card.querySelector('.risk-lv')?.textContent.trim();
   card.dataset.level=label==='\u9ad8'?'high':label==='\u4e2d'?'mid':label==='\u4f4e'?'low':'unknown';
  });
  const mode=document.body.dataset.mode||'unselected';
  const isLife=mode==='lifespan';
  $('resultAsset').setAttribute('aria-pressed',String(!isLife));$('resultLife').setAttribute('aria-pressed',String(isLife));
  $('a80mainLabel').textContent='80歳時点の資産差額';
 heading.textContent=isLife?'健康年数の参考シナリオ':'健康資産の参考シナリオ';
 const magnitude=asset.querySelector('.a80-c-cell.res .cl');if(magnitude)magnitude.textContent='差額の大きさ（絶対値）';
  $('a80mainSub').textContent='比較基準との差です。実際の資産残高や、確定する損失額ではありません。';
  chartSummary.textContent=selected('age')+'から80歳まで、比較基準と現在の条件の資産推移を示します。80歳時点の差額：'+$('a80diffBig').textContent+'。';
  const first=asset.querySelector('.a80-c-cell .cl');if(first)first.textContent='比較基準（追加負担なし）';
  const list=$('resultInputList');list.replaceChildren();
  appendPair(list,'基本条件',selected('gender')+'・'+selected('age'));
  appendPair(list,'運動習慣',selected('habit'));
  appendPair(list,'喫煙',selected('smoking'));
  if(!isLife){appendPair(list,'年収',String($('income').value).trim()!==''?$('income').value+'万円':'未入力（モデル設定を使用）');appendPair(list,'現在の資産',String($('assets').value).trim()!==''?$('assets').value+'万円':'未入力（モデル設定を使用）');appendPair(list,'計算期間',selected('age')+'から80歳まで');}
  const ids=['height','weight','waist','sbp','dbp','ldl','hdl','tg','glucose','hba1c','ast','alt','ggt'];
  const entered=ids.filter(id=>String($(id).value).trim()!=='').length;
  $('resultMissingNote').textContent=entered<ids.length?'健診値 '+entered+'/13項目を入力。未入力の項目があり、モデルの初期設定・推定を含みます。未入力を「問題なし」とは判断できません。':'健診値 13/13項目を入力。入力数は医学的な診断・個人予測の精度を示すものではありません。';
  scenario.textContent=$('selectedChanges').textContent.includes('未選択')||!['impExercise','impQuitSmoke'].some(id=>$(id)?.checked)&&!Number($('impWeightLoss')?.value)?'比較条件はまだ変えていません。選ぶと、元の入力条件との差を確認できます。':'比較で変えた条件は上に表示しています。元の健診値・基本情報は書き換えていません。';
  const per=$('roiSessionValue');if(per){const block=per.closest('.roi-session-value')?.parentElement;const label=block?.querySelector('.roi-session-label');if(label)label.textContent='30分の運動1回あたりに換算したモデル上の差額';}
  const ran=!document.body.classList.contains('pre-run');if(ran&&(!previouslyRun||lastMode!==mode))running.textContent=isLife?'健康年数の参考シナリオを表示しました。':'健康資産の参考シナリオを表示しました。';if(ran&&recovered)running.textContent='修正した有効な条件で再計算しました。';previouslyRun=ran;lastMode=mode;
  const nav=document.querySelector('.step-nav-item[href="#step2"]');if(nav)nav.dataset.resultState=ran?'calculated':'not-calculated';
 }
 $('demoFillBtn')?.addEventListener('click',()=>{$('sampleDataNote').hidden=false;});
 $('resetFormBtn').addEventListener('click',()=>{$('sampleDataNote').hidden=true;pairWarning.hidden=true;});
 const update=window.updateAll;
 window.updateAll=function(...args){if(showPairWarning()){context.classList.add('is-stale');return;}const out=update.apply(this,args);render();return out;};
 // Preserve focus and expose the existing error rather than silently failing.
 const err=$('simulationInputError');if(err){err.setAttribute('role','alert');err.setAttribute('tabindex','-1');}
 $('runBtn').addEventListener('click',()=>{requestAnimationFrame(()=>{if(err&&!err.hidden)err.focus();});});
 document.querySelectorAll('#advancedInputs input').forEach(e=>{e.setAttribute('autocomplete','off');if($('e-'+e.id))e.setAttribute('aria-describedby','e-'+e.id);});
 $('income').setAttribute('aria-description','万円単位。空欄の場合はモデルの初期設定を使います。');
 $('assets').setAttribute('aria-description','預貯金と投資の合計を万円単位で入力します。');
 $('ocrStatus')?.setAttribute('role','status');$('ocrStatus')?.setAttribute('aria-live','polite');
 $('ocrConfirm')?.setAttribute('aria-describedby','ocrStatus');
 $('surveyCounter')?.setAttribute('aria-live','polite');
 // A concrete overview of what the result contains, without changing the mode.
 document.querySelector('.hero-copy>p').innerHTML='健診結果と生活習慣を入力。<br>80歳時点の資産差額と健康年数の参考シナリオを比べます。';
 $('simulationResults').setAttribute('aria-describedby','resultReadyStatus');
 const reading=$('resultReadingOrder');if(reading){reading.setAttribute('tabindex','0');reading.setAttribute('role','region');reading.setAttribute('aria-label','比較対象・計算条件・損失内訳。小さい画面では横にスクロールできます。');}
 function ensureInputMode(){if(document.body.dataset.mode==='unselected')$('modeAsset').click();}
 $('resetFormBtn').addEventListener('click',ensureInputMode);ensureInputMode();
 render();
})();
