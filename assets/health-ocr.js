/* Health check OCR: images remain in browser memory; no upload or persistence. */
(function(root){
'use strict';
const fields=[
 ['height','身長','cm',/身\s*長/],['weight','体重','kg',/体\s*重/],['waist','腹囲','cm',/腹\s*囲/],
 ['sbp','収縮期血圧','mmHg',/収縮期(?:血圧)?|最高血圧/],['dbp','拡張期血圧','mmHg',/拡張期(?:血圧)?|最低血圧/],
 ['ldl','LDLコレステロール','mg/dL',/LDL(?:[\s-]*(?:コレステロール|C))?/i],
 ['hdl','HDLコレステロール','mg/dL',/HDL(?:[\s-]*(?:コレステロール|C))?/i],
 ['tg','中性脂肪','mg/dL',/中性脂肪|トリグリセリド|\bTG\b/i],
 ['glucose','空腹時血糖','mg/dL',/空腹時血糖(?:値)?|\bFBS\b/i],
 ['hba1c','HbA1c','%',/Hb\s*A\s*1\s*c(?:\s*\(?NGSP\)?)?/i],
 ['ast','AST','U/L',/\bAST\b(?:\s*\(?GOT\)?)?|\bGOT\b/i],
 ['alt','ALT','U/L',/\bALT\b(?:\s*\(?GPT\)?)?|\bGPT\b/i],
 ['ggt','γ-GTP','U/L',/(?:γ|Γ|y|ガンマ|ァ)\s*[-ー]?\s*GTP|\bGGT\b/i]
];
function parse(text){
 const found={};
 for(const raw of text.normalize('NFKC').split(/[\r\n]+/)){
  const line=raw.replace(/[，]/g,',').replace(/([一-龥ぁ-ん])\s+(?=[一-龥ぁ-ん])/g,'$1');
  for(const [id,,unit,re] of fields){
   const m=re.exec(line); if(!m)continue;
   let tail=line.slice(m.index+m[0].length);
   // Do not cross into another test on the same line.
   let end=tail.length;
   for(const [, , ,other] of fields){const n=other.exec(tail);if(n)end=Math.min(end,n.index);}
   tail=tail.slice(0,end).replace(/mg\s*\/\s*d[l1]|mmHg|cm|kg|U\s*\/\s*L|NGSP/gi,'');
   const values=[...tail.matchAll(/(?:^|[^\d.])(-?\d+(?:\.\d+)?)/g)].map(x=>x[1]);
   if(!values.length)continue;
   if(!found[id])found[id]={values:[],lines:[],ambiguous:false};
   const f=found[id]; f.lines.push(line.trim());
   f.ambiguous ||= /mmol|lbs?|inch|インチ|ポンド/i.test(tail) || values.length!==1 || /基準|参考|正常|前回|昨年|以下|以上|[<>≦≧]|\d\s*[-~〜～]\s*\d/.test(line);
   f.values.push(...values);
  }
 }
 for(const f of Object.values(found)){f.values=[...new Set(f.values)];f.ambiguous ||= f.values.length!==1;}
 return found;
}
// Separate unambiguous, ambiguous/out-of-range, and missing candidates.
function classifyCandidate(candidate,min,max){
 if(!candidate||!candidate.values.length)return 'unread';
 const value=Number(candidate.values[0]);
 return candidate.ambiguous||!Number.isFinite(value)||(min!==''&&value<Number(min))||(max!==''&&value>Number(max))?'review':'read';
}
if(typeof module!=='undefined'&&module.exports){module.exports={parse,fields,classifyCandidate};return;}
const $=id=>document.getElementById(id);
let worker=null, generation=0, busy=false, previewURL=null, loadPromise=null, currentPass=0, workerController=null, activeSession=null, lastFile=null, workerEpoch=0;
function status(s){$('ocrStatus').textContent=s;}
function dropWorker(){workerEpoch++;if(workerController){workerController.abort();workerController=null;}if(worker){worker.terminate().catch(()=>{});worker=null;}}
function clearReview(){ document.getElementById('ocrPhotoDialog')?.close?.(); document.getElementById('ocrReviewPhoto')?.removeAttribute('src'); $('ocrRows').replaceChildren();$('ocrText').textContent='';$('ocrReview').hidden=true; $('ocrConfirm').checked=false; $('ocrApply').disabled=false; }
function releaseImage(){document.getElementById('ocrPhotoDialog')?.close?.();document.getElementById('ocrReviewPhoto')?.removeAttribute('src');document.getElementById('ocrLargePhoto')?.removeAttribute('src');if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;$('ocrPreview').removeAttribute('src');$('ocrPreview').hidden=true;}
function setInputsDisabled(disabled){['ocrFile','ocrCamera'].forEach(id=>{if($(id))$(id).disabled=disabled;});}
function stop(){generation++;activeSession?.cancel();activeSession=null;dropWorker();busy=false;setInputsDisabled(false);$('ocrCancel').hidden=true;$('ocrProgress').hidden=true;}
function load(){
 if(root.Tesseract?.BP_LIFECYCLE==='20261124.2')return Promise.resolve();
 if(loadPromise)return loadPromise;
 loadPromise=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='assets/ocr/tesseract-lifecycle.min.js?v=20261124.2';
  const timer=setTimeout(()=>{s.remove();loadPromise=null;reject(new Error('load'));},30000);
  s.onload=()=>{clearTimeout(timer);if(root.Tesseract?.BP_LIFECYCLE==='20261124.2')resolve();else{loadPromise=null;reject(new Error('load'));}};s.onerror=()=>{clearTimeout(timer);s.remove();loadPromise=null;reject(new Error('load'));};
  document.head.append(s);
 });return loadPromise;
}
function showReview(text,documents=[]){
 const result=documents.length&&root.BPHealthOCRParser?root.BPHealthOCRParser.mergeDocuments(documents):parse(text);clearReview();$('ocrText').textContent=text;
 if(!$('ocrReviewLayout')){
  const layout=document.createElement('div');layout.id='ocrReviewLayout';layout.className='ocr-review-layout';
  const aside=document.createElement('aside');aside.className='ocr-photo-panel';
  const title=document.createElement('strong');title.textContent='写真の数値を確認';
  const photo=document.createElement('img');photo.id='ocrReviewPhoto';photo.alt='選択した健診結果。入力候補と照合してください';
  const zoom=document.createElement('button');zoom.type='button';zoom.textContent='写真を拡大して確認';
  const dialog=document.createElement('dialog');dialog.id='ocrPhotoDialog';dialog.setAttribute('aria-label','健診結果の写真を拡大');
  const close=document.createElement('button');close.type='button';close.textContent='写真を閉じる';close.addEventListener('click',()=>{if(dialog.close)dialog.close();else dialog.removeAttribute('open');});
  const large=document.createElement('img');large.id='ocrLargePhoto';large.alt='拡大した健診結果';dialog.append(close,large);document.body.append(dialog);
  zoom.addEventListener('click',()=>{large.src=photo.src;if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');});
  aside.append(title,photo,zoom);$('ocrRows').before(layout);layout.append(aside,$('ocrRows'));
 }
 $('ocrReviewPhoto').src=$('ocrPreview').src;$('ocrPreview').hidden=true;

 const defs=[['review','確認が必要','複数の候補・基準値・範囲外の可能性があります。写真の今回の結果を入力してください。'],['read','読み取り候補あり','数値の候補を入力済みです。写真の今回の結果と単位を確認してください。'],['unread','未読の項目','必要な項目だけ手入力できます。空欄なら入力済みの値は変更しません。']];
 const groups={};const counts={read:0,review:0,unread:0};
 const summary=document.createElement('p');summary.className='ocr-summary';summary.id='ocrSummary';summary.setAttribute('role','status');$('ocrRows').append(summary);
 for(const [key,title,help] of defs){
  const group=document.createElement('fieldset');group.className='ocr-group';group.dataset.category=key;
  const legend=document.createElement('legend');legend.textContent=title;
  const hint=document.createElement('p');hint.textContent=help;group.append(legend,hint);$('ocrRows').append(group);groups[key]=group;
 }
 for(const [id,label,unit] of fields){
  const f=result[id];const target=$(id);const kind=classifyCandidate(f,target.min,target.max);counts[kind]++;
  const row=document.createElement('div');row.className='ocr-row';row.dataset.category=kind;
  const labelEl=document.createElement('label');labelEl.htmlFor='ocr-'+id;labelEl.textContent=label+' ('+unit+')';
  const input=document.createElement('input');input.type='number';input.inputMode='decimal';input.step='any';input.id='ocr-'+id;input.dataset.target=id;input.min=target.min;input.max=target.max;
  input.value=kind==='read'?f.values[0]:'';input.setAttribute('aria-describedby','ocr-source-'+id+' ocr-edit-'+id);
  const source=document.createElement('p');source.id='ocr-source-'+id;source.className='ocr-source';
  source.textContent=f?.lines.length?'読取原文：'+f.lines.join(' ／ '):'読み取り候補なし';
  if(target.value)source.textContent+=' ／ 入力済み：'+target.value+'（空欄なら保持）';
  const edit=document.createElement('p');edit.id='ocr-edit-'+id;edit.className='ocr-edit-status';edit.setAttribute('aria-live','polite');
  input.addEventListener('input',()=>{
   $('ocrConfirm').checked=false;
   const invalid=input.value!==''&&!input.checkValidity();input.setAttribute('aria-invalid',String(invalid));
   edit.textContent=invalid?`入力できる範囲は${target.min}〜${target.max} ${unit}です。数値・単位を確認してください。`:input.value!==''?'入力・修正済み。写真の今回の結果と照合してください。':'空欄：この項目は反映しません。';
   updateReviewSummary();
  });
  const sourceDetails=document.createElement('details');sourceDetails.className='ocr-source-details';const sourceTitle=document.createElement('summary');sourceTitle.textContent='読取原文を確認';sourceDetails.append(sourceTitle,source);
  row.append(labelEl,input,sourceDetails,edit);
  if(kind==='review'&&f?.values.length){const choices=document.createElement('div');choices.className='ocr-candidate-choices';for(const value of f.values){const pick=document.createElement('button');pick.type='button';pick.textContent=value+'を選ぶ';pick.addEventListener('click',()=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));});choices.append(pick);}row.append(choices);}
  groups[kind].append(row);
 }
 for(const [key,title] of defs){groups[key].querySelector('legend').textContent=title+' '+counts[key]+'項目';groups[key].hidden=counts[key]===0;}
 function updateReviewSummary(){
  const all=[...$('ocrRows').querySelectorAll('input')];const entered=all.filter(el=>el.value!=='').length;
  const errors=all.filter(el=>el.value!==''&&!el.checkValidity()).length;
  summary.textContent=`候補あり ${counts.read} ／ 要確認 ${counts.review} ／ 未読 ${counts.unread} ｜ 反映予定 ${entered}項目`+(errors?`（範囲外 ${errors}項目）`:'');
  $('ocrApply').disabled=entered===0||errors>0;
 }
 updateReviewSummary();$('ocrReview').hidden=false;
 status(`読み取り候補あり${counts.read}項目・確認が必要${counts.review}項目・未読${counts.unread}項目。写真と照合してから反映してください。`);
 // Keep the image available even when nothing could be parsed.
 const focus=counts.review?groups.review:counts.read?groups.read:groups.unread;
 focus.querySelector('input')?.focus();
}
async function prepareImage(file,maxEdge=2800){
 const image=new Image();const url=URL.createObjectURL(file);
 try{image.src=url;await image.decode();const scale=Math.min(1,maxEdge/Math.max(image.naturalWidth,image.naturalHeight));
 const original=document.createElement('canvas');original.width=Math.round(image.naturalWidth*scale);original.height=Math.round(image.naturalHeight*scale);
 const ctx=original.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,original.width,original.height);ctx.drawImage(image,0,0,original.width,original.height);
 // Release the full-resolution camera image before allocating OCR buffers.
 image.src='';
 const clean=document.createElement('canvas');clean.width=original.width;clean.height=original.height;const out=clean.getContext('2d');const pixels=ctx.getImageData(0,0,original.width,original.height);const w=original.width,h=original.height,mask=new Uint8Array(w*h);
 for(let i=0;i<mask.length;i++){const j=i*4;mask[i]=(.299*pixels.data[j]+.587*pixels.data[j+1]+.114*pixels.data[j+2])<190?1:0;}
 const erased=new Uint8Array(mask.length);
 // Long straight rules obstruct table OCR. Detect against the original mask in both directions.
 for(let y=0;y<h;y++){let start=-1;for(let x=0;x<=w;x++){if(x<w&&mask[y*w+x]){if(start<0)start=x;}else if(start>=0){if(x-start>Math.max(80,w/16))for(let k=start;k<x;k++)erased[y*w+k]=1;start=-1;}}}
 for(let x=0;x<w;x++){let start=-1;for(let y=0;y<=h;y++){if(y<h&&mask[y*w+x]){if(start<0)start=y;}else if(start>=0){if(y-start>Math.max(100,h/18))for(let k=start;k<y;k++)erased[k*w+x]=1;start=-1;}}}
 for(let i=0;i<mask.length;i++){const j=i*4,v=mask[i]&&!erased[i]?0:255;pixels.data[j]=pixels.data[j+1]=pixels.data[j+2]=v;pixels.data[j+3]=255;}
 out.putImageData(pixels,0,0);return {original,clean};
 }finally{URL.revokeObjectURL(url);}
}
function progress(m){
 if(!busy||!activeSession)return;
 const stages={'loading tesseract core':'読取エンジンを取得中','initializing tesseract':'読取エンジンを起動中','loading language traineddata':'日本語データを取得中','initializing api':'日本語の読取を準備中'};
 if(m.status==='recognizing text'){
  if(m.progress!==progress.previous){activeSession.touch();progress.previous=m.progress;}
  status('健診票を読み取り中（'+currentPass+'/2）… '+Math.round(m.progress*100)+'%');$('ocrProgress').value=m.progress;
 }else if(stages[m.status]){activeSession.touch();const percent=Number.isFinite(m.progress)?' '+Math.round(m.progress*100)+'%':'';status(stages[m.status]+'…'+percent);if(percent)$('ocrProgress').value=m.progress;}
}
async function startReading(file){
 if(busy)stop();else generation++;clearReview();releaseImage();
 if(!/^image\/(jpeg|png|webp)$/.test(file.type)&&!(file.type===''&&/\.(jpe?g|png|webp)$/i.test(file.name))){status('JPEG・PNG・WebPの画像を選んでください。PDFやHEICはスクリーンショットを使ってください。');lastFile=null;return;}
 if(file.size>15*1024*1024){status('画像は15MB以下にしてください。今回の結果がある部分だけ切り抜くと読み取りやすくなります。');lastFile=null;return;}
 lastFile=file;delete $('ocrStatus').dataset.failureStage;$('ocrFileName').textContent=file.name;$('ocrRetry').hidden=true;
 const gen=generation;busy=true;setInputsDisabled(true);$('ocrCancel').hidden=false;$('ocrProgress').hidden=false;$('ocrProgress').removeAttribute('value');
 previewURL=URL.createObjectURL(file);$('ocrPreview').src=previewURL;$('ocrPreview').hidden=false;
 let completed=false,lastError=null;
 for(let attempt=0;attempt<2&&gen===generation;attempt++){
  const session=new root.BPOCRRuntime.Session();activeSession=session;let images;const documents=[];
  try{
   if(!root.Worker||!root.WebAssembly)throw new Error('unsupported');
   status(attempt?'準備からやり直しています。画像を小さくして再読取します…':'読取エンジンを準備中です。初回は通信が必要です。画像は送信しません。');
   await session.run('library',()=>load(),30000);
   const compactDevice=root.matchMedia?.('(max-width: 760px)').matches;
   images=await session.run('image',()=>prepareImage(file,attempt?1800:compactDevice?2400:2800),20000);
   if(gen!==generation)break;
   if(!worker){
    workerController=new AbortController();const epoch=workerEpoch;
    worker=await session.run('engine',()=>root.Tesseract.createWorker('jpn',1,{
     workerPath:new URL('assets/ocr/worker.min.js?v=5.1.1',document.baseURI).href,
     corePath:new URL('assets/ocr/core',document.baseURI).href,
     langPath:new URL('assets/ocr/lang',document.baseURI).href,
     cacheMethod:'none',abortSignal:workerController.signal,
     logger:m=>{if(epoch===workerEpoch)progress(m);},errorHandler:()=>{if(epoch===workerEpoch&&activeSession)activeSession.cancel('engine-error');}
    }),45000,90000);
   }
   for(const [image,mode]of [[images.clean,'6'],[images.original,'11']]){
    if(gen!==generation)break;currentPass=documents.length+1;progress.previous=-1;
    status('健診票を読み取り中（'+currentPass+'/2）…');
    await session.run('parameters',()=>worker.setParameters({preserve_interword_spaces:'1',tessedit_pageseg_mode:mode,user_defined_dpi:'300'}),10000);
    const {data}=await session.run('recognize',()=>worker.recognize(image,{}, {text:true,blocks:true,hocr:false,tsv:false}),45000,120000);
    documents.push({text:data.text,words:(data.words||data.blocks?.flatMap(b=>b.paragraphs?.flatMap(p=>p.lines?.flatMap(l=>l.words||[])||[])||[])||[]).map(w=>({text:w.text,bbox:w.bbox,confidence:w.confidence}))});
   }
   if(gen===generation){showReview(documents.map(d=>d.text).join('\n--- 別の読取設定 ---\n'),documents);completed=true;}
   break;
  }catch(error){
   lastError=error;
   if(gen!==generation)break;
   dropWorker();
   if(documents.length){showReview(documents.map(d=>d.text).join('\n'),documents);status('追加の読み取りは完了しませんでした。取得できた候補を写真と照合してください。未読項目は手入力できます。');completed=true;break;}
   if(error.message==='unsupported'||error.stage==='image')break;
  }finally{
   if(images){images.original.width=images.clean.width=1;images.original.height=images.clean.height=1;}
   if(activeSession===session)activeSession=null;
  }
 }
 if(gen===generation){
  busy=false;setInputsDisabled(false);$('ocrCancel').hidden=true;$('ocrProgress').hidden=true;
  $('ocrRetry').hidden=completed;
  if(!completed){
   const stage=lastError?.stage||'engine';$('ocrStatus').dataset.failureStage=stage;
   const reason=stage==='image'?'画像を開けませんでした。JPEGやスクリーンショットを選んでください。':lastError?.message==='unsupported'?'このブラウザは画像読取に対応していません。Safari・Chromeの最新版か手入力をご利用ください。':stage==='recognize'?'画像の読み取りが止まったため中止しました。今回の結果だけを切り抜くと読み取りやすくなります。':'読取エンジンの準備が完了しませんでした。通信を確認して、もう一度お試しください。';
   status(reason+'「もう一度読み取る」で、この画像から再開できます。');
   console.warn('Browser OCR stopped at '+stage+'; no personal image or values logged.');
  }
 }
}
async function handleImageSelection(){const file=this.files[0];this.value='';if(file)await startReading(file);}
const retry=document.createElement('button');retry.type='button';retry.id='ocrRetry';retry.hidden=true;retry.textContent='もう一度読み取る';retry.addEventListener('click',()=>{if(lastFile&&!busy)startReading(lastFile);});$('ocrCancel').after(retry);
$('ocrFile').addEventListener('change',handleImageSelection);
$('ocrCamera')?.addEventListener('change',handleImageSelection);
$('ocrCancel').addEventListener('click',()=>{stop();clearReview();releaseImage();$('ocrRetry').hidden=!lastFile;status('読み取りを中止しました。「もう一度読み取る」で同じ画像から再開できます。');});
$('ocrApply').addEventListener('click',()=>{
 if(!$('ocrConfirm').checked){status('写真の今回の結果と単位を確認し、確認欄にチェックを入れてください。');$('ocrConfirm').focus();return;}
 const inputs=[...$('ocrRows').querySelectorAll('input')].filter(x=>x.value!=='');
 if(!inputs.length){status('反映する数値がありません。写真を確認して数値を入力してください。');return;}
 for(const input of inputs){if(!input.checkValidity()){input.reportValidity();status('入力範囲を外れています。読み取った数値・単位を確認してください。');return;}}
 if($('advancedInputs').style.display==='none')$('advToggle').click();
 for(const input of inputs){const target=$(input.dataset.target);target.value=input.value;target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));}
 const count=inputs.length;lastFile=null;$('ocrRetry').hidden=true;clearReview();releaseImage();status(count+'項目を入力欄へ反映しました。読み取れなかった項目は手入力できます。');
 document.dispatchEvent(new Event('bp:ocr-applied'));
 $(inputs[0].dataset.target).focus();
});
$('ocrDiscard').addEventListener('click',()=>{lastFile=null;$('ocrRetry').hidden=true;clearReview();releaseImage();status('読み取り結果を破棄しました。入力欄は変更していません。');});
$('resetFormBtn').addEventListener('click',()=>{stop();lastFile=null;$('ocrRetry').hidden=true;clearReview();releaseImage();status('写真を選ぶと、数値の候補を表示します。');});
root.addEventListener('pagehide',()=>{stop();lastFile=null;clearReview();releaseImage();});
root.addEventListener('pageshow',e=>{if(e.persisted){setInputsDisabled(false);$('ocrRetry').hidden=true;status('写真を選び直してください。入力済みの数値は保持しています。');}});
})(typeof window==='undefined'?globalThis:window);
