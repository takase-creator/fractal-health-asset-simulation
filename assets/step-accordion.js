/* User-triggered step disclosures. Never open a step as a side effect of input/calculation. */
(function(){
 'use strict';
 const specs=[['p0','step1Title','step1'],['step2Section','step2Title','step2'],['step3','step3Title','step3'],['nextPlan','nextPlanTitle','nextPlan'],['seminarSurvey','surveyTitle','seminarSurvey']];
 const records=new Map();
 function setOpen(record,open){
  if(open)for(const other of records.values())if(other!==record){other.body.hidden=true;other.button.setAttribute('aria-expanded','false');other.indicator.textContent='＋ 開く';}
  record.body.hidden=!open;record.button.setAttribute('aria-expanded',String(open));record.indicator.textContent=open?'− 閉じる':'＋ 開く';
  if(open&&record.panel.id==='step2Section'&&!document.body.classList.contains('pre-run'))requestAnimationFrame(()=>{if(typeof redrawChart==='function')redrawChart();});
 }
 function initialize(){
  for(const [id,labelId,anchor] of specs){
   const panel=document.getElementById(id);if(!panel||panel.dataset.accordionReady)continue;
   const header=panel.querySelector(':scope > .ph');if(!header)continue;
   panel.dataset.accordionReady='true';panel.classList.add('step-accordion-section');
   const body=document.createElement('div');body.id=id+'Contents';body.className='step-accordion-body';body.hidden=true;
   for(const child of [...panel.children])if(child!==header)body.append(child);
   panel.append(body);
   if(id==='step2Section'||id==='step3'){
    const note=document.createElement('p');note.className='step-lock-note';note.textContent=id==='step2Section'?'STEP 1で「健康資産」または「健康寿命」を選んでから、健診結果と条件を入力してください。':'STEP 2でシミュレーションを実行すると、生活習慣の条件を変えて比較できます。';body.prepend(note);
   }
   const button=document.createElement('button');button.type='button';button.className='step-accordion-toggle';button.setAttribute('aria-label',document.getElementById(labelId)?.textContent.trim()||'STEPを開閉する');button.setAttribute('aria-controls',body.id);button.setAttribute('aria-expanded','false');
   const indicator=document.createElement('span');indicator.className='step-accordion-indicator';indicator.setAttribute('aria-hidden','true');indicator.textContent='＋ 開く';button.append(indicator);header.append(button);
   const record={panel,body,button,indicator,anchor};records.set(id,record);
   button.addEventListener('click',()=>{setOpen(record,body.hidden);window.dispatchEvent(new Event('scroll'));});
  }
 }
 initialize();
 const layout=document.getElementById('layout');if(layout)new MutationObserver(initialize).observe(layout,{childList:true});
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');if(!link)return;
  const target=link.getAttribute('href');if(target.length<2)return;const record=[...records.values()].find(r=>target==='#'+r.anchor||r.panel.querySelector(target));
  if(record)setOpen(record,true);
 });
})();
