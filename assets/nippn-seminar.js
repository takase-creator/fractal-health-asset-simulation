/* Presentation changes. No automatic data sharing or consultation routing. */
(function(){
 const $=id=>document.getElementById(id);
 // STEP 2 is one section from assumptions through results.
 const step2Header=$('step2');const stage2=document.createElement('section');stage2.id='step2Section';stage2.className='panel simulation-section';stage2.setAttribute('aria-labelledby','step2Title');
 const inputBody=document.createElement('div');inputBody.className='pb step2-inputs';while(step2Header.nextSibling)inputBody.append(step2Header.nextSibling);
 step2Header.className='ph';step2Header.innerHTML='<span class="ph-step">STEP 2</span><h2 id="step2Title">入力して、試算結果を見る</h2>';
 stage2.append(step2Header,inputBody,$('p1'));inputBody.prepend($('modeFlow'));$('p0').after(stage2);
 // Start with lifestyle/asset fields, then checkup photos/manual values.
 const lifestyleStart=$('gender').closest('.fg2').previousElementSibling;const assetEnd=$('assetInfoBox');const lifestyle=document.createDocumentFragment();let cursor=lifestyleStart;
 while(cursor){const next=cursor.nextSibling;lifestyle.append(cursor);if(cursor===assetEnd)break;cursor=next;}inputBody.insertBefore(lifestyle,$('modeFlow'));
 ['ocrFile','ocrCamera'].forEach(id=>$(id).addEventListener('change',()=>{$('ocrFileName').textContent=$(id).files[0]?.name||'未選択';}));
 $('resetFormBtn').addEventListener('click',()=>{$('ocrFileName').textContent='未選択';});
 // STEP 3 is the separate scenario comparison section.
 const comparison=document.createElement('section');comparison.id='step3';comparison.className='panel improvement-section';comparison.setAttribute('aria-labelledby','step3Title');comparison.innerHTML='<div class="ph"><span class="ph-step">STEP 3</span><h2 id="step3Title">生活習慣を変えて、結果を比べる</h2></div><div class="pb"></div>';
 comparison.querySelector('.pb').append($('improveBox'),$('roiBlock'));stage2.after(comparison);
 // STEP 4 follows scenario comparison; STEP 5 follows STEP 4.
 const aftercare=$('nextPlan');if(aftercare){comparison.after(aftercare);const saves=document.querySelector('.share-actions');if(saves)aftercare.querySelector('.pb').insertBefore(saves,aftercare.querySelector('.aftercare-next'));}
 // Optional services follow the five steps, just before the evidence footer.
 const support=document.createElement('section');support.id='supplementalSupport';support.className='supplemental-support';support.setAttribute('aria-label','継続サポート・サービスのご案内');support.append($('step5Toggle'),$('step5Body'));document.querySelector('.disclaimer').before(support);
 const label=document.createElement('div');label.className='review-label';label.textContent='健診結果を振り返るための参考試算です。個人の寿命・発症・資産を予測するものではありません。';document.querySelector('.disclaimer').append(label);label.classList.add('ui-model-footnote');
 const riskNote=document.createElement('p');riskNote.className='risk-reference';riskNote.innerHTML='6項目は独自ルールで整理した参考スコアです。<strong>発症確率（%）や研究の倍率ではありません。</strong>腎機能など、この入力だけでは判断できない項目もあります。';$('riskRows').before(riskNote);
 const studyLink=document.createElement('p');studyLink.className='risk-reference';studyLink.innerHTML='<a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4390315/" target="_blank" rel="noopener">出典：Kawahara et al., PLoS ONE 2015・表1</a>。比較対象・期間・集団が異なる研究の数値を、そのままあなたの発症確率や倍率には変換できません。';$('trendSrc').after(studyLink);
 const note=document.createElement('div');note.className='model-note';note.innerHTML='<strong>この結果の読み方</strong>大規模研究の関連と独自の仮定を使ったシナリオ比較です。個人の寿命・発症年齢・将来資産の予測ではありません。青線は医療費等による追加負担をゼロとした比較用の想定です。年率3%の運用・所得の変化等を仮定し、運動費用、交通費・待ち時間の金銭換算は含めていません。';$('age80box').after(note);
 const lifeNote=note.cloneNode(false);lifeNote.className='model-note mode-life-only';lifeNote.innerHTML='<strong>健康年数は参考シナリオです</strong>あなたの死亡年齢や病気になる年齢を算出するものではありません。集団の傾向を個人へ当てはめた独自の計算で、個人予測としての妥当性は検証されていません。';$('lifespanResult').after(lifeNote);
 note.classList.add('mode-asset-only');
 const roi=$('roiBlock');roi.classList.add('mode-asset-only');
 // Hide consultations as requested; optional service information remains closed.
 document.querySelectorAll('[id="consultOverlay"],[id="consultModal"],[id="stickyCta"]').forEach(el=>el.hidden=true);
 const desc={glucose:'血糖・HbA1cと、体格・生活習慣を確認します。',bp:'血圧と、心臓・脳の血管への負担に関係する項目です。',lipid:'LDL・HDL・中性脂肪の入力を確認します。',liver:'AST・ALT・γ-GTPを確認。原因の診断はできません。',kidney:'腎機能の診断はできません。eGFR・尿検査等を医療機関で確認します。',musculo:'筋肉・関節の不調や運動習慣を整理します。診断ではありません。'};
 function annotate(){ $('riskRows').querySelectorAll('.risk-row').forEach((row,i)=>{if(row.querySelector('.risk-explain'))return;const p=document.createElement('p');p.className='risk-explain';p.textContent=desc[RISK_LABELS[i][1]];row.append(p);const refs={glucose:['kawahara2015','dpp2002'],bp:['edwards2023'],lipid:['kraus2002'],liver:['hallsworth2011'],kidney:['greenwood2015'],musculo:['pahor2014']};if(window.BPResearch)row.append(BPResearch.createDetails(refs[RISK_LABELS[i][1]]));}); }
 new MutationObserver(annotate).observe($('riskRows'),{childList:true});annotate();
 // Keep additional support unobtrusive, never open the contact form from the roadmap.
 $('nextPlanTrack')?.querySelectorAll('[data-next-action="support"]').forEach(el=>el.hidden=true);
})();
(function(){
 document.querySelectorAll('#formOverlay').forEach(el=>{el.hidden=true;el.setAttribute('inert','');el.style.display='none';});
})();
