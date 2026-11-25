/* Position-aware extraction shared by browser OCR and public-sample tests. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BPHealthOCRParser=factory();})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
const defs=[['height',/身長/],['weight',/体重/],['waist',/腹囲/],['sbp',/収縮期(?:血圧)?|最高(?:血圧)?/],['dbp',/拡張期(?:血圧)?|最低(?:血圧)?/],['ldl',/LDL(?:コレステロール|-?C(?:H)?)?/i],['hdl',/HDL(?:コレステロール|-?C(?:H)?)?/i],['tg',/空腹時中性脂肪|中性脂肪|トリグリセ(?:リ|ラ)イド|TG/i],['glucose',/空腹時血[糖村](?:値)?|FBS/i],['hba1c',/Hb-?[Dd]?A[1Il]c[C]?(?:\(?NGSP\)?)?/i],['ast',/AST(?:[・(]GOT\)?)?|GOT(?:\(AST\)?)?/i],['alt',/ALT(?:[・(]GPT\)?)?|GPT(?:\(ALT\)?)?/i],['ggt',/(?:γ|Γ|y|ガンマ|ァ|アニ|ア|ヶ|と)[_\-]*(?:GTP|GT|6T)|GGT/i]];
function norm(s){return String(s||'').normalize('NFKC').replace(/[ー−－–―]/g,'-').replace(/\s/g,'');}
function parseDocument(data,extraHeaders=[]){
 const words=(data.words||[]).filter(w=>w.bbox&&w.text&&w.bbox.y1>w.bbox.y0).map(w=>({...w,t:norm(w.text),cy:(w.bbox.y0+w.bbox.y1)/2}));
 const heights=words.map(w=>w.bbox.y1-w.bbox.y0).sort((a,b)=>a-b);const median=heights[Math.floor(heights.length/2)]||20;
 const rows=[];for(const w of words.sort((a,b)=>a.cy-b.cy)){let r=rows.findLast?rows.findLast(r=>Math.abs(r.y-w.cy)<Math.min(median*.62,(w.bbox.y1-w.bbox.y0)*.65)):rows.slice().reverse().find(r=>Math.abs(r.y-w.cy)<median*.58);if(!r){r={y:w.cy,words:[]};rows.push(r);}r.words.push(w);}
 for(const r of rows){r.words.sort((a,b)=>a.bbox.x0-b.bbox.x0);let i=0,previous=null;r.text='';r.maps=r.words.map(w=>{if(previous&&/[0-9.]$/.test(previous.t)&&/^[0-9.]/.test(w.t)&&w.bbox.x0-previous.bbox.x1>median*.5){r.text+='|';i++;}const m={word:w,start:i,end:i+w.t.length};i=m.end;r.text+=w.t;previous=w;return m});}
 const headerCenter=(maps,start,length)=>{const first=maps[0],last=maps[maps.length-1];const a=first.word.bbox.x0+(first.word.bbox.x1-first.word.bbox.x0)*Math.max(0,start-first.start)/Math.max(1,first.word.t.length);const b=last.word.bbox.x0+(last.word.bbox.x1-last.word.bbox.x0)*Math.min(last.word.t.length,start+length-last.start)/Math.max(1,last.word.t.length);return (a+b)/2;};
 const headers=[];for(const row of rows){for(const re of [/今回(?!の|は|が|を)|本年|本日|最新/g,/記入例/g]){for(const m of row.text.matchAll(re)){const ws=row.maps.filter(w=>w.start<m.index+m[0].length&&w.end>m.index);headers.push({y:row.y,x:headerCenter(ws,m.index,m[0].length),type:'current'});}}
 for(const re of [/前回/g,/前々回/g,/基準値/g]){for(const m of row.text.matchAll(re)){const ws=row.maps.filter(w=>w.start<m.index+m[0].length&&w.end>m.index);headers.push({y:row.y,x:headerCenter(ws,m.index,m[0].length),type:'other'});}}}
 // When a printed current-column heading was lost, keep dated columns separate.
 for(const row of rows){const dated=row.words.filter(w=>/^(?:H|R|平成|令和)?\d{1,4}\/\d{1,2}\/\d{1,2}$/.test(w.t));if(dated.length<2)continue;
 const groups=[];let group=[];for(const word of dated){if(group.length&&word.bbox.x0-group[group.length-1].bbox.x1>median*14){groups.push(group);group=[];}group.push(word);}groups.push(group);
 for(const g of groups){if(g.length<2)continue;const rank=t=>{const n=t.replace(/^(H|R|平成|令和)/,'').split('/').map(Number);return n[0]*10000+n[1]*100+n[2];};const latest=g.reduce((a,b)=>rank(a.t)>=rank(b.t)?a:b);for(const w of g)headers.push({y:row.y,x:(w.bbox.x0+w.bbox.x1)/2,type:w===latest?'current':'other',inferred:true});}
 }
 if(data.headersOnly)return headers;headers.push(...extraHeaders);
 const found={};
 for(const row of rows){const anchors=[];for(const [id,re]of defs){const m=re.exec(row.text);if(!m)continue;if(id==='hdl'&&/(?:non|mon)-?$/i.test(row.text.slice(0,m.index)))continue;if(id==='tg'&&m[0].toUpperCase()==='TG'&&(/[A-Za-z]/.test(row.text[m.index-1]||'')||/[A-Za-z]/.test(row.text[m.index+m[0].length]||'')))continue;if((id==='sbp'||id==='dbp')&&/最高.{0,2}最低/.test(row.text)&&/\d{2,3}\/\d{2,3}/.test(row.text))continue;if(id==='weight'&&/標準体重/.test(row.text))continue;if(id==='tg'&&/随時中性脂肪/.test(row.text)&&!/空腹時中性脂肪/.test(row.text))continue;
 const ws=row.maps.filter(w=>w.start<m.index+m[0].length&&w.end>m.index);anchors.push({id,index:m.index,end:m.index+m[0].length,right:ws[ws.length-1].word.bbox.x1});}
 anchors.sort((a,b)=>a.index-b.index);
 for(let i=0;i<anchors.length;i++){const a=anchors[i];const next=anchors[i+1];let numeric=row.maps.filter(m=>m.start>=a.end&&(!next||m.start<next.index)).map(m=>{const excluded=[...row.text.matchAll(/\d+(?:\.\d+)?(?:[~〜～へ…-]+\d+(?:\.\d+)?|(?:以下|以上|未満|未江))/g)];if(excluded.some(x=>m.start<x.index+x[0].length&&m.end>x.index))return null;const mi=row.maps.indexOf(m);if(/^(?:以下|以上|未満|未江|以|[~〜～ー-])/.test(row.maps[mi+1]?.word.t||'')||/[~〜～]$/.test(row.maps[mi-1]?.word.t||''))return null;const raw=m.word.t.replace(/^[↑↓*+]+/,'').replace(/[%]$/,'');const fixed=raw.replace(/[Oo]/g,'0');if(!/^-?\d+(?:[.,]\d+)?$/.test(fixed))return null;return {value:fixed.replace(',','.'),x:(m.word.bbox.x0+m.word.bbox.x1)/2,confidence:m.word.confidence??0,corrected:fixed!==raw};}).filter(Boolean);
 const current=headers.filter(h=>h.type==='current'&&h.y<row.y&&h.x>a.right).sort((a,b)=>b.y-a.y||a.x-b.x)[0];
 if(current){const peers=headers.filter(h=>h.type==='other'&&Math.abs(h.y-current.y)<median*2);if(peers.length)numeric=numeric.filter(n=>peers.every(p=>Math.abs(n.x-current.x)<=Math.abs(n.x-p.x)));}
 if(!numeric.length)continue;const values=[...new Set(numeric.map(n=>n.value))];const f=found[a.id]||(found[a.id]={values:[],lines:[],ambiguous:false,method:'position'});f.values.push(...values);f.lines.push(row.words.map(w=>w.text).join(' '));f.selectedCurrent ||=!!current;f.inferredCurrent ||=!!current?.inferred;f.confidence=Math.min(f.confidence??100,...numeric.map(n=>n.confidence));f.ambiguous ||= values.length!==1||numeric.some(n=>n.confidence<75||n.corrected);
 }
 }
 for(const row of rows){
 if(!/血圧|最高.{0,2}最低/.test(row.text))continue;
 const pairs=row.maps.filter(m=>/^(\d{2,3})\/(\d{2,3})$/.test(m.word.t));if(!pairs.length)continue;
 const header=headers.filter(h=>h.type==='current'&&h.y<row.y&&h.x>row.words[0].bbox.x0).sort((a,b)=>b.y-a.y||a.x-b.x)[0];
 const selected=header?pairs.filter(m=>headers.filter(h=>h.type==='other'&&Math.abs(h.y-header.y)<median*2).every(h=>Math.abs((m.word.bbox.x0+m.word.bbox.x1)/2-header.x)<Math.abs((m.word.bbox.x0+m.word.bbox.x1)/2-h.x))):pairs;
 for(const [id,index]of [['sbp',0],['dbp',1]])if(selected.length&&!found[id])found[id]={values:selected.map(m=>m.word.t.split('/')[index]),lines:[row.words.map(w=>w.text).join(' ')],ambiguous:selected.length!==1||!header||header.inferred,selectedCurrent:!!header,inferredCurrent:!!header?.inferred,method:'position',confidence:Math.min(...selected.map(m=>m.word.confidence||0))};
 }

 for(const f of Object.values(found)){f.values=[...new Set(f.values)];f.ambiguous ||=f.values.length!==1;}
 return found;
}

const bounds={height:[100,250],weight:[20,300],waist:[40,200],sbp:[60,260],dbp:[30,160],ldl:[30,400],hdl:[15,150],tg:[20,1500],glucose:[40,600],hba1c:[3,15],ast:[5,1000],alt:[5,1000],ggt:[5,2000]};
function mergeDocuments(documents){
 const output={};const sharedHeaders=documents.flatMap(d=>parseDocument({...d,headersOnly:true}));
 for(const data of documents){const parsed=parseDocument(data,sharedHeaders);for(const [id,f]of Object.entries(parsed)){
 const valid=f.values.filter(v=>{const n=Number(v),b=bounds[id];return Number.isFinite(n)&&n>=b[0]&&n<=b[1];});
 if(!valid.length)continue;
 let target=output[id];if(target?.selectedCurrent&&!f.selectedCurrent)continue;if(!target||(!target.selectedCurrent&&f.selectedCurrent)){target=output[id]={values:[],lines:[],ambiguous:false,confidence:0,method:'position',selectedCurrent:!!f.selectedCurrent};}
 target.values.push(...valid);target.lines.push(...f.lines);target.confidence=Math.max(target.confidence,f.confidence||0);target.ambiguous ||= f.ambiguous||f.inferredCurrent||valid.length!==f.values.length;
 }}
 for(const f of Object.values(output)){f.values=[...new Set(f.values)];f.lines=[...new Set(f.lines)];f.ambiguous ||=f.values.length!==1||f.confidence<75;}
 return output;
}
return {parseDocument,mergeDocuments,defs,bounds};
});
