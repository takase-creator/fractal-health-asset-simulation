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
 ['ggt','γ-GTP','U/L',/[γyYガンマ]\s*[-ー]?\s*GTP|\bGGT\b/i]
];
function parse(text){
 const found={};
 for(const raw of text.normalize('NFKC').split(/[\r\n]+/)){
  const line=raw.replace(/[，]/g,',').replace(/(?<=[一-龥ぁ-ん])\s+(?=[一-龥ぁ-ん])/g,'');
  for(const [id,,unit,re] of fields){
   const m=re.exec(line); if(!m)continue;
   let tail=line.slice(m.index+m[0].length);
   // Do not cross into another test on the same line.
   let end=tail.length;
   for(const [, , ,other] of fields){const n=other.exec(tail);if(n)end=Math.min(end,n.index);}
   tail=tail.slice(0,end).replace(/mg\s*\/\s*d[l1]|mmHg|cm|kg|U\s*\/\s*L|NGSP/gi,'');
   const values=[...tail.matchAll(/(?<![\d.])-?\d+(?:\.\d+)?/g)].map(x=>x[0]);
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
if(typeof module!=='undefined'&&module.exports){module.exports={parse,fields};return;}
const $=id=>document.getElementById(id);
let worker=null, generation=0, busy=false, previewURL=null, loadPromise=null;
function status(s){$('ocrStatus').textContent=s;}
function clearReview(){ $('ocrRows').replaceChildren();$('ocrText').textContent='';$('ocrReview').hidden=true; $('ocrConfirm').checked=false; }
function releaseImage(){if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;$('ocrPreview').removeAttribute('src');$('ocrPreview').hidden=true;}
function stop(){generation++;if(worker){worker.terminate().catch(()=>{});worker=null;}busy=false;$('ocrFile').disabled=false;$('ocrCancel').hidden=true;$('ocrProgress').hidden=true;}
function load(){
 if(root.Tesseract)return Promise.resolve();
 if(loadPromise)return loadPromise;
 loadPromise=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='assets/ocr/tesseract.min.js';
  const timer=setTimeout(()=>{s.remove();loadPromise=null;reject(new Error('load'));},30000);
  s.onload=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);s.remove();loadPromise=null;reject(new Error('load'));};
  document.head.append(s);
 });return loadPromise;
}
function showReview(text){
 const result=parse(text);clearReview();$('ocrText').textContent=text;
 for(const [id,label,unit] of fields){
  const f=result[id]||{values:[],lines:[],ambiguous:true};
  const target=$(id), row=document.createElement('div');row.className='ocr-row';
  const labelEl=document.createElement('label');labelEl.htmlFor='ocr-'+id;labelEl.textContent=label+' ('+unit+')';
  const input=document.createElement('input');input.type='number';input.inputMode='decimal';input.step='any';input.id='ocr-'+id;input.dataset.target=id;input.min=target.min;input.max=target.max;
  input.value=f.ambiguous?'':f.values[0];input.setAttribute('aria-describedby','ocr-source-'+id);
  const source=document.createElement('p');source.id='ocr-source-'+id;source.className='ocr-source';
  source.textContent=!f.lines.length?'読み取り候補なし。写真の結果を手入力するか、空欄のままにしてください。':(f.ambiguous?'複数の数値・基準値の可能性があります。今回の結果を入力してください。 ':'')+'読取：'+f.lines.join(' ／ ')+(target.value?' ／ 入力済み：'+target.value+'（反映すると置き換わります）':'');
  if(!f.lines.length&&target.value)source.textContent+=' 入力済み：'+target.value+'（空欄なら変更しません）';
  row.append(labelEl,input,source);$('ocrRows').append(row);
 }
 const count=Object.keys(result).length;
 if(!count){releaseImage();status('項目を見つけられませんでした。今回の結果と項目名が見える範囲を切り抜いて、明るく正面から撮り直してください。手入力もできます。');return;}
 $('ocrReview').hidden=false; status(count+'項目の候補を読み取りました。写真と照合し、今回の結果・単位を確認してください。空欄の項目は反映しません。');
 $('ocrConfirm').focus();
}
$('ocrFile').addEventListener('change',async function(){
 const file=this.files[0];this.value='';if(!file)return;
 stop();clearReview();releaseImage();
 if(!/^image\/(jpeg|png|webp)$/.test(file.type)){status('JPEG・PNG・WebPの画像を選んでください。PDFやHEICは画像に変換するか、スクリーンショットを使ってください。');return;}
 if(file.size>15*1024*1024){status('画像は15MB以下にしてください。今回の結果がある部分だけ切り抜くと読み取りやすくなります。');return;}
 const gen=generation;busy=true;this.disabled=true;$('ocrCancel').hidden=false;$('ocrProgress').hidden=false;$('ocrProgress').removeAttribute('value');
 previewURL=URL.createObjectURL(file);$('ocrPreview').src=previewURL;$('ocrPreview').hidden=false;
 status('読取エンジンを準備中です。初回は通信と時間が必要です。画像は送信しません。');
 let localWorker;let timer;
 try{
  const operation=(async()=>{
   await load();if(gen!==generation)return;
   localWorker=await root.Tesseract.createWorker('jpn+eng',1,{
    workerPath:new URL('assets/ocr/worker.min.js',document.baseURI).href,
    logger:m=>{if(gen!==generation)return;if(m.status==='recognizing text'){status('画像を読み取り中… '+Math.round(m.progress*100)+'%');$('ocrProgress').value=m.progress;}}
   });
   if(gen!==generation){await localWorker.terminate();return;}
   worker=localWorker;
   await worker.setParameters({preserve_interword_spaces:'1'});
   const result=await worker.recognize(file);
   if(gen===generation)showReview(result.data.text);
  })();
  await Promise.race([operation,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('timeout')),180000);})]);
 }catch(e){if(gen===generation){status('読み取りを完了できませんでした。通信環境と画像形式を確認して、もう一度お試しください。手入力もできます。');releaseImage();}}
 finally{clearTimeout(timer);if(gen===generation)stop();}
});
$('ocrCancel').addEventListener('click',()=>{stop();clearReview();releaseImage();status('読み取りを中止しました。画像を選び直すか、手入力してください。');});
$('ocrApply').addEventListener('click',()=>{
 if(!$('ocrConfirm').checked){status('写真の今回の結果と単位を確認し、確認欄にチェックを入れてください。');$('ocrConfirm').focus();return;}
 const inputs=[...$('ocrRows').querySelectorAll('input')].filter(x=>x.value!=='');
 if(!inputs.length){status('反映する数値がありません。写真を確認して数値を入力してください。');return;}
 for(const input of inputs){if(!input.checkValidity()){input.reportValidity();status('入力範囲を外れています。読み取った数値・単位を確認してください。');return;}}
 if($('advancedInputs').style.display==='none')$('advToggle').click();
 for(const input of inputs){const target=$(input.dataset.target);target.value=input.value;target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));}
 const count=inputs.length;clearReview();releaseImage();status(count+'項目を入力欄へ反映しました。読み取れなかった項目は手入力できます。');
 $(inputs[0].dataset.target).focus();
});
$('ocrDiscard').addEventListener('click',()=>{clearReview();releaseImage();status('読み取り結果を破棄しました。入力欄は変更していません。');});
$('resetFormBtn').addEventListener('click',()=>{stop();clearReview();releaseImage();status('健診結果の写真を選ぶと、数値の入力候補を作成します。');});
root.addEventListener('pagehide',()=>{stop();releaseImage();});
})(typeof window==='undefined'?globalThis:window);
