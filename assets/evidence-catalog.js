/* Source catalogue and disclosures only. Never changes calculator inputs or results. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),studies=window.BPResearch?.studies;if(!studies||$('evidenceCatalog'))return;
 const el=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt)e.textContent=txt;if(cls)e.className=cls;return e;};
 function link(txt,url){const a=el('a',txt);a.href=url;if(url.startsWith('https:')){a.target='_blank';a.rel='noopener';}else if(url.startsWith('#')){a.target='_self';a.addEventListener('click',event=>{const target=document.getElementById(url.slice(1));if(!target)return;event.preventDefault();target.scrollIntoView({block:'start',behavior:'auto'});target.tabIndex=-1;target.focus({preventScroll:true});});}return a;}
 const official=[
 ['screening','厚生労働省「標準的な健診・保健指導プログラム（令和6年度版）別紙5」','https://www.mhlw.go.jp/content/10900000/001172507.pdf','保健指導・受診勧奨判定値と受診案内。診断基準や個人の発症確率とは異なります。'],
 ['hale','厚生労働省「健康寿命の令和4年値について」','https://www.mhlw.go.jp/content/10904750/001363069.pdf','男性72.57年・女性75.45年は全国の集団指標。本ツールでは、この全国値から個人の現年齢を引く処理を廃止しました。'],
 ['activity','厚生労働省「健康づくりのための身体活動・運動ガイド2023」','https://www.mhlw.go.jp/content/001195866.pdf','成人の身体活動1日60分以上、運動週60分以上、筋トレ週2〜3日など。30分×週3回は画面の比較例で、全員への一律処方ではありません。'],
 ['income','国税庁「令和6年分 民間給与実態統計調査」','https://www.nta.go.jp/publication/statistics/kokuzeicho/minkan2024/pdf/R06_000.pdf','背景資料として掲載。年収への自動適用を廃止し、未入力は説明用の仮定500万円と表示します。将来の年収は一定と仮定します。'],
 ['pension','厚生労働省「厚生年金保険・国民年金事業の概況」（令和5年度を参照）','https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000106808_1.html','年金統計の参考資料。画面の固定年金額は個人の受給見込額ではなく、加入歴・受給開始時期・改定を反映しません。'],
 ['household','総務省統計局「家計調査年報 2022年 結果の概要」','https://www.stat.go.jp/data/kakei/2022np/pdf/summary.pdf','世帯別家計の参考資料。本ツールの貯蓄率・退職後支出は固定仮定で、原表の統計値そのものとしては扱いません。'],
 ['medical','厚生労働省「令和4年度 国民医療費 結果の概要」','https://www.mhlw.go.jp/toukei/saikin/hw/k-iryohi/22/dl/data.pdf','全国医療費の集計資料。この統計を個人の疾病別費用へ変換しません。根拠を確認できない旧版の疾病別・段階別費用は計算から廃止しました。']
 ];
 const section=el('section','','evidence-catalog');section.id='evidenceCatalog';section.setAttribute('aria-labelledby','evidenceCatalogTitle');
 section.append(el('h2','引用元と計算の根拠'));section.firstChild.id='evidenceCatalogTitle';section.append(el('p',`論文${studies.length}本・公的資料${official.length}件を掲載しています。研究で報告された値と、このシミュレーション独自の計算を分けて確認できます。`,'evidence-lead'));
 const nav=el('nav','','evidence-nav');nav.setAttribute('aria-label','引用元と計算の根拠の目次');for(const [t,id]of [['表示数値の根拠','numberBasis'],['独自モデルの仮定','modelAssumptions'],['全論文一覧','allStudies'],['公的資料一覧','officialSources']])nav.append(link(t,'#'+id));section.append(nav);
 const heading=(id,t)=>{const h=el('h3',t);h.id=id;section.append(h);return h;};
 heading('numberBasis','表示数値は、どこから来たものか');
 const rows=[
 ['studyNumbers','HbA1c別の5年間の発症割合・HR','研究の報告値','Kawahara 2015の表1を、入力HbA1cの区分に照合。発症割合とHRは別指標です。','個人の発症確率や、運動後の改善率ではありません。',['kawahara2015']],
 ['scoreBasis','6領域の参考スコア（0〜100）','独自の配点','年齢・入力値・体格・運動・喫煙等に点数を加えます。40点・70点は独自の表示区分です。','背景論文は点数全体を検証したものではありません。未入力でも習慣等から点数が出るため、未入力＝健康ではありません。',[]],
 ['activityBasis','運動条件による点数の変化','研究を参考にした独自換算','既存実装は週0・1・3時間を結ぶ曲線を0〜14点に換算。喫煙本数の補間も独自です。','研究の死亡HRを、6領域の発症確率や金額へ直接置き換えたものではありません。',['coleman2022','hackshaw2018']],
 ['lifeBasis','50歳からの3疾患のない余命の群間差','論文の観察値','Li 2020 表2。男性0項目群23.5年／4〜5項目群31.1年、群間差7.6年（95%CI 6.8〜8.4）。女性23.7年／34.4年、群間差10.6年（95%CI 10.0〜11.3）。','米国医療従事者の観察研究。個人の年齢・健診値・選択した習慣から群を判定せず、個人の延伸年数へ換算しません。',['li2020']],
 ['assetBasis','80歳時点の資産差額・推移グラフ','入力した家計の仮定','追加費用ゼロの線・現在の費用・変更後の費用で資産を毎年計算。健診値や参考ポイントから費用を推定しません。','医療効果や将来資産の予測ではありません。収支・利回りの想定を比べる計算です。',[]],
 ['exerciseYenBasis','30分の運動1回に換算した金額','入力費用による差額の割り算','変更後と現在条件の資産差額（万円）×10,000÷［（80−現在年齢）×52週×3回］。','変更後の運動費用を年額で差し引きます。1回の運動が生む利益や医療費削減の実測値ではありません。',[]]

 ];
 const table=el('table','','basis-table'),head=el('thead'),hr=el('tr');for(const t of ['表示する数値','根拠の種類','計算・参照するもの','読み取れる範囲'])hr.append(el('th',t));head.append(hr);table.append(head);const body=el('tbody');
 for(const [id,label,kind,how,limit,refs]of rows){const tr=el('tr');tr.id=id;[label,kind,how,limit].forEach((v,i)=>{const td=el('td',v);td.dataset.label=['表示する数値','根拠の種類','計算・参照するもの','読み取れる範囲'][i];if(i===2)for(const ref of refs){const j=studies.findIndex(s=>s.id===ref);td.append(' ',link('['+(j+1)+']','#study-'+ref));}tr.append(td);});body.append(tr);}table.append(body);section.append(table);
 heading('modelAssumptions','独自モデルの仮定と計算式');section.append(el('p','2026年11月26日、研究に裏付けられない医療費・個人の健康年数の換算を廃止しました。結果欄・推移グラフ・条件比較は維持し、下記の式へ修正しています。'));
 function detail(title,paragraphs){const d=el('details','','model-method'),summary=el('summary',title);d.append(summary);for(const t of paragraphs)d.append(el('p',t));section.append(d);return d;}
 detail('参考スコアの配点を確認する',[
 '全領域の点数・丸め・上限100点、40点未満／40〜69点／70点以上の区分は独自ルールです。発症確率（%）や医学的なリスク分類ではありません。',
 '共通の年齢加点A＝max(0, 年齢−30)×0.9。運動加点Hは週0時間で14点、週1時間で約6.22点、週3時間以上で0点となる独自の曲線です。BMI加点の係数Bは通常BMI25以上で1、それ未満・未入力で0。減量条件の比較時だけBMI22〜35の間を0〜1で補間します。',
 '糖代謝＝A＋男性3点＋H＋12B。腹囲（男性85cm以上・女性90cm以上）10点。血糖100〜125で14点、126以上で25点。HbA1c 5.6／5.8／6.0／6.2／6.5%以上で6／10／16／20／26点を追加。最終値は四捨五入し100点が上限です。',
 '血圧＝A＋H＋2＋8B。収縮期血圧130／140／150／160以上で8／15／20／26点、該当腹囲で8点を追加。喫煙は現在15×本数補正、過去7点。脂質＝A＋H＋1＋8B。LDL120／140／160以上で8／14／22点、該当腹囲で8点。喫煙は現在10×本数補正、過去4点。',
 '肝機能の参考点数＝max(0,A−5)＋H＋10B。腎機能の参考点数＝A＋1に、収縮期血圧130以上8点、血糖100以上7点、HbA1c5.6%以上7点を加算。筋骨格の参考点数＝10＋H（現在の画面では症状チェックを使っていません）。',
 'この版の点数に、AST・ALT・γ-GTP、HDL、中性脂肪、拡張期血圧を直接反映する配点はありません。入力項目すべてを用いた医学的判定ではありません。特に腎機能はeGFR・尿蛋白を入力しないため診断・評価できません。',
 '喫煙本数補正：20本/日以上を1とし、1本/日の補正を男性0.46・女性0.31、1〜20本の間を対数で補間します。この点数への適用は独自で、禁煙による即時の改善量を表しません。'
 ]);
 detail('健康年数の表示と研究条件を確認する',[
 'Li 2020の2つの米国コホート研究（女性73,196人、男性38,366人）。50歳から糖尿病・心血管疾患・がんのない余命を比較します。日本の「日常生活に制限のない期間」とは定義が違います。',
 '低リスク条件は食事・BMI・身体活動・喫煙・飲酒の5条件。画面は0項目群と4〜5項目群を比較し、入力性別に対応する研究値を表示します。入力年齢から余命を引き算せず、個人を研究群へ割り当てません。飲酒を始める提案ではありません。',
 '群間差は論文の報告値を使用します。女性の34.4−23.7は表示値では10.7ですが、論文の丸め前の計算による差は10.6年です。個人の延伸年数・運動だけの効果・誤差範囲ではありません。',
 '旧版の血圧・血糖・喫煙・BMI・運動による年数の加減、飽和式、全国健康寿命から年齢を引く式は廃止しました。'
 ]);
 detail('資産・費用の計算式を確認する',[
 '単位は万円。翌年資産＝現在資産＋max(0,現在資産)×入力利回り＋その年の収支。80歳の到達時点まで計算し、80歳でもう1年分を加算しません。資産が負の場合は資金不足として表示し、借入利息を推定しません。',
 '退職前の年間収支＝年収×資産に回す割合−年収×収入減率−年間追加費用。退職後＝年間手取り収入−年間生活費−年間追加費用。収入減は退職前に限り、貯蓄率を掛けずに収支から差し引きます。',
 '青線は追加費用・収入減ゼロの比較線、赤線は現在の入力費用・収入減、緑線は変更後の入力費用＋運動費用・変更後の収入減。同じ年収・初期資産・期間・利回りで比較します。生活習慣の選択だけでは費用を自動的に減らしません。',
 '未入力年収500万円、未入力資産0万円、資産に回す割合10%、退職65歳、退職後手取り180万円/年・生活費180万円/年、利回り3%は説明用の仮定です。統計平均の自動適用ではなく、画面で確認・変更できます。税・物価・所得制限・給付・借入利息は自動反映しません。',
 '追加費用・収入減の初期値0は未設定の計算用の値です。健康・費用ゼロという判定ではありません。本人負担額を入力し、通常の生活費や他の費用との重複を除いてください。費用の仮例20→10万円/年、運動費3万円/年は説明例で、実績や医学的効果に基づく額ではありません。',
 '差額の内訳：追加費用累計＋収入減累計＋運用益の差＝80歳時点の比較基準との差（丸め差を除く）。運用益の差は、資産差額から2つの累計を差し引いて求めます。'
 ]);
 detail('今回、根拠が不足していたため廃止した係数',[
 '独自スコアから疾病別医療費への換算、5年後の自動進行、複数領域による1〜2倍の費用補正、生涯医療費への独自倍率、健康年数への年齢・検査値・運動等の加減を廃止しました。引用論文はこれらの個人換算を検証していません。',
 '参考ポイントは過去の匿名アンケート集計との連続性のため同じ配点を維持しますが、医学的な疾患群ではありません。健診値の照合表示と分離し、金額・健康年数へは一切換算しません。過去の回答や企業の受付期間は変更しません。'
 ]);
 heading('allStudies',`全論文一覧（${studies.length}本）`);section.append(el('p','書誌情報はすべて表示しています。「研究結果・対象者・限界」を開くと、このツールでの使い方まで確認できます。','evidence-help'));
 const list=el('ol','','source-list');for(const [i,s]of studies.entries()){
 const li=el('li');li.id='study-'+s.id;const h=el('h4');h.append(link(`[${i+1}] ${s.citation}`,s.url));li.append(h,el('p',s.title,'source-title'),el('p',s.area+'｜'+s.design,'source-meta'));
 const d=el('details');d.append(el('summary','研究結果・対象者・限界'));for(const [label,v]of [['対象・期間',s.population+'。'+s.period],['研究結果',s.finding],['限界',s.limit],['このツールでの扱い',s.use]]){const p=el('p');p.append(el('strong',label+'：'),document.createTextNode(v));d.append(p);}li.append(d);list.append(li);
 }section.append(list);
 heading('officialSources',`公的資料一覧（${official.length}件）`);const ol=el('ol','','official-list');for(const [i,[id,title,url,note]]of official.entries()){const li=el('li');li.id='official-'+id;li.append(link(`[公的資料${i+1}] ${title}`,url),el('p',note));ol.append(li);}section.append(ol,el('p','出典・計算式の確認日：2026年11月26日。論文を増やしても、独自スコアや個人の資産・健康年数の予測精度が検証されたことにはなりません。','evidence-help'));
 // Last visible content in the main page, outside all STEP and disclaimer disclosures.
 const footer=document.querySelector('.disclaimer');const root=footer?.parentElement||document.body;root.append(section);
 for(const [id,target,label]of [['a80mainSub','assetBasis','金額の計算式・仮定'],['lifeLostSub','lifeBasis','年数の計算式・仮定'],['roiBlock','exerciseYenBasis','1回換算の計算式・仮定'],['riskTitle','scoreBasis','参考スコアの根拠'],['trendSrc','studyNumbers','研究値の出典・読み方']]){const t=$(id);if(!t)continue;const p=el('p','','number-source-link');p.append(link(label+' →','#'+target));if(id==='roiBlock')t.append(p);else t.after(p);}
 const all=el('p','','all-source-link');all.append(link(`全論文${studies.length}本・公的資料${official.length}件を一覧で見る →`,'#evidenceCatalog'));document.querySelector('.disclaimer')?.before(all);
})();
