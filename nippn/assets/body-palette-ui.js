/* Presentation only. Preserve calculator IDs, consent, step disclosures and model rules. */
(()=>{'use strict';const $=id=>document.getElementById(id);
 const icons={arrow:'<path d="M4 12h15M13 5l7 7-7 7"/>',shield:'<path d="M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 12h18"/>',chart:'<path d="M4 4v16h17M8 15l4-5 4 3 5-7"/>',heart:'<path d="M20 5c-3-3-7 0-8 2-1-2-5-5-8-2-5 5 3 11 8 15 5-4 13-10 8-15Z"/><path d="M5 12h4l2-3 2 6 2-3h4"/>',camera:'<path d="m8 6 2-3h4l2 3h5v15H3V6z"/><circle cx="12" cy="13" r="4"/>',file:'<path d="M14 3H5v18h14V8zM14 3v6h5"/><path d="M8 13h8M8 17h5"/>'};
 const svg=name=>'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
 const label=document.querySelector('.review-label');if(label){document.querySelector('.disclaimer').append(label);label.classList.add('ui-model-footnote');}
 const captions=['確認したいテーマを選びます。','生活習慣・健診結果を入力して確認します。','取り組みたいことを選び、内容を整理します。','会社の取り組みと、健診後の受診案内を確認します。','使いやすさや、これから取り組みたいことを回答します。'];
 ['p0','step2Section','step3','nextPlan','seminarSurvey'].forEach((id,i)=>{const section=$(id),head=section?.querySelector(':scope>.ph');if(!head)return;const num=head.querySelector('.ph-step');if(num)num.textContent='STEP '+(i+1);const title=[...head.children].find(el=>el!==num&&!el.matches('button'));if(!title)return;const wrap=document.createElement('div');wrap.className='ui-section-heading';title.before(wrap);wrap.append(title);const description=document.createElement("p");description.className="ui-section-caption";description.textContent=captions[i];wrap.append(description);});
 const nextSteps=[['p0','#step2','STEP 2 入力へ進む'],['step2Section','#step3','STEP 3 条件を変えて比べる'],['step3','#nextPlan','STEP 4 社内の施策・受診案内を見る']];
 nextSteps.forEach(([id,target,text])=>{const body=$(id)?.querySelector(':scope>.step-accordion-body');if(!body)return;const footer=document.createElement('div');footer.className='ui-step-footer';const link=document.createElement('a');link.className='ui-step-next';link.href=target;link.textContent=text+' →';footer.append(link);body.append(footer);});
 document.querySelectorAll('.mode-ico').forEach((el,i)=>{el.innerHTML=svg(i===0?'chart':'heart');});
 [['ocrCameraButton','camera'],['ocrFile','file']].forEach(([id,name])=>{const el=$(id),label=id==='ocrFile'?el?.closest('label'):el;if(label){const mark=document.createElement('span');mark.className='ui-control-icon';mark.innerHTML=svg(name);label.prepend(mark);}});
 document.querySelectorAll('.exam-reason .er-ico').forEach(el=>el.hidden=true);
 // Enlarge actual result values; keep empty-state messages at reading size.
 ['a80diffBig','lifeLostBig','roiProtect','roiSessionValue'].forEach(id=>{const el=$(id);if(!el)return;const mark=()=>{el.dataset.valueKind=/[0-9０-９]/.test(el.textContent)?'number':'message';};mark();new MutationObserver(mark).observe(el,{childList:true,subtree:true,characterData:true});});
 // Keep optional inputs compact while retaining every calculator ID.
 const assetBox=$('assetInfoBox');
 if(assetBox){
  const details=document.createElement('details');details.id='optionalAssets';details.className='mode-asset-only optional-assets';
  details.innerHTML='<summary>年収・資産を入力する<span>任意</span></summary><p class="optional-defaults">未入力の場合：年収は年齢・性別の平均値、総資産は0万円として試算します。</p>';
  assetBox.before(details);details.append(assetBox);$('assetInfoTitle').hidden=true;
 }
 const photo=document.querySelector('.ocr-box'),manual=$('advancedInputs'),legacy=$('advToggle');
 if(photo&&manual&&legacy){
  const chooser=document.createElement('div');chooser.className='checkup-method';chooser.setAttribute('role','group');chooser.setAttribute('aria-label','健診結果の入力方法');
  chooser.innerHTML='<h3>健診結果を入力する<span>任意</span></h3><div class="checkup-method-buttons"><button type="button" id="choosePhoto" aria-pressed="true" aria-controls="ocrEntry">写真から読み取る</button><button type="button" id="chooseManual" aria-pressed="false" aria-controls="advancedInputs">数値を手入力する</button></div>';
  photo.id='ocrEntry';photo.before(chooser);legacy.hidden=true;
  const select=(method,focus=false)=>{
   const isManual=method==='manual';
   if(manual.style.display==='none'&&isManual||manual.style.display!=='none'&&!isManual)legacy.click();
   photo.hidden=isManual;$('choosePhoto').setAttribute('aria-pressed',String(!isManual));$('chooseManual').setAttribute('aria-pressed',String(isManual));
   if(focus)manual.querySelector('input')?.focus();
  };
  $('choosePhoto').addEventListener('click',()=>select('photo'));
  $('chooseManual').addEventListener('click',()=>select('manual'));
  // Validation/demo/legacy controls may open the manual fields directly.
  new MutationObserver(()=>{const open=manual.style.display!=='none';photo.hidden=open;$('choosePhoto').setAttribute('aria-pressed',String(!open));$('chooseManual').setAttribute('aria-pressed',String(open));}).observe(manual,{attributes:true,attributeFilter:['style']});
  document.addEventListener('bp:ocr-applied',()=>select('manual'));
  const progress=$('ocrProgress');new MutationObserver(()=>{const busy=!progress.hidden;$('choosePhoto').disabled=busy;$('chooseManual').disabled=busy;}).observe(progress,{attributes:true,attributeFilter:['hidden']});
  $('resetFormBtn').addEventListener('click',()=>select('photo'));
 }
 // The logo is a navigation affordance; text remains visible to screen readers.
 document.body.classList.add('ui-refreshed');requestAnimationFrame(()=>window.dispatchEvent(new Event('scroll')));
})();
