/* Source catalogue and disclosures only. Never changes calculator inputs or results. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),studies=window.BPResearch?.studies;if(!studies||$('evidenceCatalog'))return;
 const el=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt)e.textContent=txt;if(cls)e.className=cls;return e;};
 function link(txt,url){const a=el('a',txt);a.href=url;if(url.startsWith('https:')){a.target='_blank';a.rel='noopener';}else if(url.startsWith('#')){a.target='_self';a.addEventListener('click',event=>{const target=document.getElementById(url.slice(1));if(!target)return;event.preventDefault();target.scrollIntoView({block:'start',behavior:'auto'});target.tabIndex=-1;target.focus({preventScroll:true});});}return a;}
 const official=[
 ['hale','厚生労働省「健康寿命の令和4年値について」','https://www.mhlw.go.jp/content/10904750/001363069.pdf','男性72.57年・女性75.45年は全国の集団指標。この値から現年齢を引く本ツールの処理は、年齢別の平均余命計算とは異なります。'],
 ['activity','厚生労働省「健康づくりのための身体活動・運動ガイド2023」','https://www.mhlw.go.jp/content/001195866.pdf','成人の身体活動1日60分以上、運動週60分以上、筋トレ週2〜3日など。30分×週3回は画面の比較例で、全員への一律処方ではありません。'],
 ['income','国税庁「令和6年分 民間給与実態統計調査」','https://www.nta.go.jp/publication/statistics/kokuzeicho/minkan2024/pdf/R06_000.pdf','給与統計の参考資料。既存の年収テーブル・年齢間の補間・入力年収による倍率調整はモデルの設定値です。原表との全セル一致は未確認です。'],
 ['pension','厚生労働省「厚生年金保険・国民年金事業の概況」（令和5年度を参照）','https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000106808_1.html','年金統計の参考資料。画面の固定年金額は個人の受給見込額ではなく、加入歴・受給開始時期・改定を反映しません。'],
 ['household','総務省統計局「家計調査年報 2022年 結果の概要」','https://www.stat.go.jp/data/kakei/2022np/pdf/summary.pdf','世帯別家計の参考資料。本ツールの貯蓄率・退職後支出は固定仮定で、原表の統計値そのものとしては扱いません。'],
 ['medical','厚生労働省「令和4年度 国民医療費 結果の概要」','https://www.mhlw.go.jp/toukei/saikin/hw/k-iryohi/22/dl/data.pdf','全国医療費の集計資料。下記の疾病別・段階別の年額を、この統計から直接算出できたとは確認できないため、独自の費用仮定として明記します。']
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
 ['lifeBasis','健康年数・条件変更後の年数差','公的統計＋独自の係数','全国の健康寿命の値を起点に、入力条件ごとの独自係数を用いて比較します。','個人の死亡年齢・発症年齢・余命ではありません。HRから年数への換算は検証されていません。',['li2020','sasazuki2011']],
 ['assetBasis','80歳時点の資産差額・推移グラフ','独自の資産モデル','年率3%、収入・貯蓄・生活費・追加医療費等の仮定から毎年の資産を積み上げます。','青線は追加医療費・収入減をゼロとする比較条件。実在の健康な人の資産推移ではありません。',[]],
 ['exerciseYenBasis','30分の運動1回に換算した金額','モデル差額の割り算','運動条件を変えた80歳時点の差額（万円）×10,000÷［（80−現在年齢）×52週×3回］。','1回の運動で得られる収入や医療費節約の実測値ではありません。運動費用も差し引いていません。',[]]
 ];
 const table=el('table','','basis-table'),head=el('thead'),hr=el('tr');for(const t of ['表示する数値','根拠の種類','計算・参照するもの','読み取れる範囲'])hr.append(el('th',t));head.append(hr);table.append(head);const body=el('tbody');
 for(const [id,label,kind,how,limit,refs]of rows){const tr=el('tr');tr.id=id;[label,kind,how,limit].forEach((v,i)=>{const td=el('td',v);td.dataset.label=['表示する数値','根拠の種類','計算・参照するもの','読み取れる範囲'][i];if(i===2)for(const ref of refs){const j=studies.findIndex(s=>s.id===ref);td.append(' ',link('['+(j+1)+']','#study-'+ref));}tr.append(td);});body.append(tr);}table.append(body);section.append(table);
 heading('modelAssumptions','独自モデルの仮定と計算式');section.append(el('p','以下は現在の計算で実際に使う設定です。研究を追加しても、係数や既存の試算結果は変更していません。'));
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
 detail('健康年数の係数を確認する',[
 '全国指標の起点：男性72.57年・女性75.45年［公的資料1］。基準の残り年数＝max(4, 起点−現在年齢)。全国の出生時指標から現年齢を差し引く独自処理で、現在年齢別の健康余命とは異なります。',
 '独自の年数加減：運動は−4×exp(−週の運動時間÷1.5)。血圧は男性−2.2／女性−2.9を基礎に、収縮期120〜140で比例、140以上は20mmHgごと0.6加算（倍率上限2.4）。糖代謝は男性−7.2／女性−10.3に独自の重みを掛けます。HbA1c5.6〜6.5未満では（値−5.6）÷0.9×0.35、6.5以上では1＋（値−6.5）÷3（上限1.2）。血糖100〜126未満は（値−100）÷26×0.35、126以上では1。両方ある場合は大きい重みを使います。これらは個人の健康寿命差として検証された係数ではありません。',
 '喫煙：過去−1.7年、現在は−（1.5＋2×min(1,本数÷20)＋重喫煙加算）。BMIは27超／20未満の差を5で割り−1.6倍し、該当腹囲でさらに−0.6年（下限−4年）。LDL140超は40mg/dLごと−0.8年（下限−1.5年）。これは研究から直接読み取れる個人の延伸年数ではなく独自設定です。',
 '複数条件は単純加算で出力せず、Lmax×［1−exp(−合計差÷Lmax)］で飽和させます。Lmaxは男性12.5・女性13.5。現在条件の残り年数は最低2年、表示は丸めます。上限・下限・飽和式も独自の仮定です。',
 '条件比較の年数差は、条件変更前後でこの同じモデルを再計算した差です。全国指標、死亡研究、疾患のない余命は定義が異なり、一つの研究がこの計算全体を検証したものではありません。'
 ]);
 detail('資産・収入・生活費の設定を確認する',[
 '各年の資産＝前年資産×1.03＋その年の貯蓄。65歳未満は（モデル収入−仮定した収入減）×貯蓄率−追加医療費。65歳以降は固定年金−固定生活費−追加医療費。80歳まで繰り返します。実際の税・物価・運用変動は計算しません。',
 '貯蓄率：30歳未満20%、30代18%、40代13%、50代13%、60〜64歳10%。65歳以降は貯蓄率ではなく、年金から固定生活費を差し引きます。未入力資産は0万円、入力年収がある場合は年齢表との比率を将来年収にも適用します。',
 '入力年収がない場合の固定年齢表（25／30／35／40／45／50／55歳、万円）：男性446／517／566／612／653／693／735、女性360／383／393／399／403／408／410。間の年齢は線形補間。60〜64歳は59歳時年収の80%から年齢ごと2ポイント減らし、65歳で年金に切り替えます。公表統計との全値一致は未確認のため、統計そのものではなく固定仮定として扱います。',
 '年金の固定値：男性200.4万円/年、女性130.8万円/年。65歳以降の生活費：男性324万円/年・女性186万円/年。既存設定では性別によって想定世帯が異なり、家族構成を入力していないため個別家計の見積りには使えません。',
 '年率3%は保証利回りではありません。モデル医療費の負担割合は入力値（初期30%）、収入減も入力値（初期0%）です。青線は追加医療費・収入減をゼロにした比較条件で、健康な人にもかかる通常医療費を網羅する線ではありません。'
 ]);
 detail('追加医療費・進行・複数領域の仮定を確認する',[
 'モデル上の年額（万円、低い段階／中間／高い段階）：糖代謝3／22／50、血圧3／11／100、脂質は血圧費用の0.7倍、肝機能3／18／50、腎機能3／30／136。国民医療費の統計から、これらの段階別金額を直接再現できたとは未確認です。独自の費用仮定であり、患者1人の医療費の予測ではありません。',
 'スコア40未満は32〜40点の間だけ費用を0から最初の年額へ補間。40〜70、70〜90点の間は次の年額へ補間。スコア70以上が5年続く場合等に段階を上げる処理も仮定で、実際の疾病進行ではありません。',
 '複数領域の補正は60〜80点の間を重みにし、合計重み0〜2で1〜1.4倍、2〜3で1.4〜2倍、上限2倍。脂質の0.7倍と他領域の補正の適用も独自です。領域間の重複費用を医学的に調整したモデルではありません。',
 '高額療養費・健保付加給付・税・交通費・待ち時間・運動費用は自動反映しません。根拠論文を追加しても、この未検証の費用換算が検証済みになるわけではありません。'
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
