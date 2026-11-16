/* Presentation changes. No automatic data sharing or consultation routing. */
(function(){
 const $=id=>document.getElementById(id);
 // STEP 2 is one section from assumptions through results.
 const step2Header=$('step2');const stage2=document.createElement('section');stage2.id='step2Section';stage2.className='panel simulation-section';stage2.setAttribute('aria-labelledby','step2Title');
 const inputBody=document.createElement('div');inputBody.className='pb step2-inputs';while(step2Header.nextSibling)inputBody.append(step2Header.nextSibling);
 step2Header.className='ph';step2Header.innerHTML='<span class="ph-step">STEP 2</span><h2 id="step2Title">入力して、試算結果を見る</h2>';
 stage2.append(step2Header,inputBody,$('p1'));inputBody.prepend($('modeFlow'));$('p0').after(stage2);
 // Start with lifestyle/asset fields, then checkup photos/manual values.
 const lifestyleStart=$('gender').closest('.fg2').previousElementSibling;const assetEnd=$('cigCountField');const lifestyle=document.createDocumentFragment();let cursor=lifestyleStart;
 while(cursor){const next=cursor.nextSibling;lifestyle.append(cursor);if(cursor===assetEnd)break;cursor=next;}inputBody.insertBefore(lifestyle,$('modeFlow'));
 ['ocrFile','ocrCamera'].forEach(id=>$(id).addEventListener('change',()=>{if($(id).files[0])$('ocrFileName').textContent=$(id).files[0].name;}));
 $('resetFormBtn').addEventListener('click',()=>{$('ocrFileName').textContent='未選択';});
 // STEP 3 is the separate scenario comparison section.
 const comparison=document.createElement('section');comparison.id='step3';comparison.className='panel improvement-section';comparison.setAttribute('aria-labelledby','step3Title');comparison.innerHTML='<div class="ph"><span class="ph-step">STEP 3</span><h2 id="step3Title">生活習慣を変えて比べる</h2></div><div class="pb"></div>';
 comparison.querySelector('.pb').append($('improveBox'));stage2.after(comparison);
 // STEP 4 follows scenario comparison; STEP 5 follows STEP 4.
 const aftercare=$('nextPlan');if(aftercare){comparison.after(aftercare);const saves=document.querySelector('.share-actions');if(saves)aftercare.querySelector('.pb').insertBefore(saves,aftercare.querySelector('.aftercare-next'));}
 // Optional services follow the five steps, just before the evidence footer.
 const support=document.createElement('section');support.id='supplementalSupport';support.className='supplemental-support';support.setAttribute('aria-label','継続サポート・サービスのご案内');support.append($('step5Toggle'),$('step5Body'));document.querySelector('.disclaimer').before(support);
 const riskNote=document.createElement('p');riskNote.className='risk-reference';riskNote.innerHTML='厚生労働省の保健指導・受診勧奨判定値との照合です。<strong>疾病の診断・発症確率の算出ではありません。</strong>未入力の検査は評価しません。';$('riskRows').before(riskNote);
 const refs={glucose:['kawahara2015','dpp2002'],bp:['edwards2023'],lipid:['kraus2002'],liver:['hallsworth2011'],kidney:['greenwood2015'],musculo:['pahor2014']};
 function annotate(){ $('riskRows').querySelectorAll('.risk-row').forEach((row,i)=>{if(row.querySelector('.research-details'))return;if(window.BPResearch)row.append(BPResearch.createDetails(refs[RISK_LABELS[i][1]],'この領域に関する研究を見る'));}); }
 new MutationObserver(annotate).observe($('riskRows'),{childList:true});annotate();
 // Keep additional support unobtrusive, never open the contact form from the roadmap.
 $('nextPlanTrack')?.querySelectorAll('[data-next-action="support"]').forEach(el=>el.hidden=true);
})();
(function(){
 document.querySelectorAll('#formOverlay').forEach(el=>{el.hidden=true;el.setAttribute('inert','');el.style.display='none';});
})();
