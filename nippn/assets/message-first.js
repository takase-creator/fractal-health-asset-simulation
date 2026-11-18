/* Nippn review: a clear checkup-to-action journey. No medical rules are changed. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 document.body.classList.add('message-first');
 const sections=[
  ['p0','step1Title','使い方を確認する','健診票をご用意ください。写真がなくても手入力できます。'],
  ['step2Section','step2Title','入力して、シミュレーション結果を見る','健診値・生活習慣・試算条件を入力し、グラフと結果を確認します。'],
  ['step3','step3Title','条件を変えて、結果を比べる','運動・禁煙・体重の条件を変え、参考シナリオの差を確認します。'],
  ['nextPlan','nextPlanTitle','社内制度・受診案内を確認する','受診の案内と、貴社で利用できる健康施策を確認します。'],
  ['seminarSurvey','surveyTitle','アンケートに答える','操作の分かりやすさと、取り組みたいことについて回答します。']
 ];
 const note=document.querySelector('.nippn-review-note');
 if(note)note.innerHTML='<strong>株式会社ニップン様｜操作確認用</strong><p>公開期間は未設定です。アンケートの回答は送信・保存されません。</p>';
 document.querySelector('.ui-brand-context').textContent='健康資産・健康年数のシミュレーション';
 document.querySelector('.hero-tag').textContent='健診結果と生活習慣から、参考シナリオを比較。';
 document.querySelector('.hero h1').innerHTML='健診結果から、<br><span>将来のシナリオを比べる。</span>';
 const intro=document.querySelector('.hero-copy > p');intro.innerHTML='健診結果と生活習慣を入力。<br>健康資産・健康年数の参考シナリオを比べます。';
 const start=document.querySelector('.ui-start');start.href='#step2';start.innerHTML='シミュレーションをはじめる <span aria-hidden="true">→</span>';
 document.querySelector('.hero-input-note').textContent='写真がなくても手入力できます。画像・健診値はこの端末内で処理します。';
 function begin(){ $('modeAsset').click(); }
 start.addEventListener('click',begin);
 // Keep the original mode IDs for calculator compatibility; theme selection is
 // not a prerequisite question for this checkup review journey.
 $('modeSelect').hidden=false;
 $('step2Section').querySelector('.step2-inputs').prepend($('modeSelect'));
 document.querySelector('.mode-select-q').textContent='表示する結果を選ぶ';
 const guide=document.createElement('div');guide.className='review-preparation';
 guide.innerHTML='<p class="preparation-title">健診票をご用意ください。</p><p>今回の数値が分かる写真・スクリーンショット、または健診票をお手元にご用意ください。写真から読み取った数値は、反映する前にご自身で確認します。</p><a href="#step2" class="review-begin">入力をはじめる <span aria-hidden="true">→</span></a>';
 $('p0').querySelector('.step-accordion-body').prepend(guide);
 guide.querySelector('a').addEventListener('click',begin);
 $('p0').querySelector('.ui-step-footer')?.remove();
 document.querySelector('.steps-intro h2').textContent='入力から、次の行動を考えるまで';
 document.querySelector('.steps-intro p').textContent='見たい項目を押すと開きます。';
 const navLabels=['使い方','入力・結果','条件比較','社内制度・受診','アンケート'];
 document.querySelectorAll('.sn-label').forEach((el,i)=>el.textContent=navLabels[i]);
 // The financial arithmetic remains available as an optional reference, after
 // the five main steps, rather than competing with the health checkup result.
 const cost=$('clinicalCost');
 if(cost){const optional=document.createElement('details');optional.className='review-cost-details';optional.innerHTML='<summary>補足：費用を自分の条件で比較する</summary>';cost.before(optional);optional.append(cost);document.querySelector('.clinical-methods').before(optional);}
 function copyForState(s){
  sections.forEach(([id,titleId,title,caption])=>{
   const p=$(id),h=$(titleId);if(h)h.textContent=title;
   const desc=p?.querySelector('.ui-section-caption');if(desc)desc.textContent=caption;
   p?.querySelector('.step-accordion-toggle')?.setAttribute('aria-label',title);
  });
  document.querySelectorAll('.step-lock-note').forEach(e=>e.textContent=e.closest('#step3')?'健診結果を確認してから、取り組むことを選んでください。':'「健診結果を入力する」から進んでください。');
  document.querySelectorAll('.ui-step-next').forEach(e=>{const dest=e.getAttribute('href');e.textContent=dest==='#step3'?'次へ：条件を変えて比べる →':dest==='#nextPlan'?'次へ：社内制度・受診案内を確認する →':e.textContent;});
  if(!s||!s.checks)return;
  const items=Object.values(s.checks.items),high=items.filter(i=>i.level==='high').length,mid=items.filter(i=>i.level==='mid').length,entered=items.filter(i=>i.level!=='unknown').length;
  const summary=document.querySelector('.clinical-result-summary');
  summary.dataset.attention=high?'referral':mid?'guidance':'unassessed';
  summary.querySelector('h3').textContent=high?high+'項目が受診勧奨の判定値に該当しています。':mid?mid+'項目が保健指導の判定値に該当しています。':entered?'入力した'+entered+'項目を照合しました。':'確認したい健診値を入力してください。';
  summary.querySelector('p').textContent=high?'健診票の受診案内をご確認ください。受診の必要性や時期は、健診機関・主治医の指示に従ってください。':mid?'該当する数値と健診票の案内を確認し、生活習慣を振り返ってみましょう。判定値未満や未入力でも、病気がないことを意味しません。':entered?'入力した検査だけの照合結果です。未入力や判定値未満でも、病気がないことを意味しません。健診票の判定・受診案内を優先してください。':'今回の健診結果と単位を確認して入力してください。未入力の検査は評価できません。';
  const tag=summary.querySelector('.basis-tag');if(tag)tag.textContent='まず確認すること';
  $('riskTitle').textContent='どの数値が該当したかを確認';
  $('runBtn').textContent='入力した健診値の結果を見る';
  $('improveTitle').textContent='これから取り組みたいことは？';
  $('improveSub').textContent='選んだ内容を整理します。選択だけで健診値が変わるわけではありません。';
 }
 const original=window.renderMedicalReview;
 if(typeof original==='function')window.renderMedicalReview=function(state){original(state);copyForState(state);};
 const originalUpdate=window.updateAll;
 window.updateAll=function(...args){const result=originalUpdate.apply(this,args);copyForState(null);return result;};
 const modelNote=document.createElement('p');modelNote.className='restored-model-note';modelNote.textContent='以下は、計算条件を置いた参考シナリオです。未検証の独自換算を含み、個人の寿命・発症・実際の将来資産や、運動の金銭効果を予測するものではありません。';$('simulationResults').after(modelNote);
 copyForState(null);
 if(['#step2','#step3'].includes(location.hash))begin();
 updateAll();
})();
