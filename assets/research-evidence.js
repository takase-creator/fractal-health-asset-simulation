/* Verified study summaries; no automatic effect-size or model-coefficient changes. */
const BP_RESEARCH = [
  {
    "id": "kawahara2015",
    "area": "糖代謝",
    "citation": "Kawahara et al., PLoS ONE 2015",
    "title": "Incidence of Type 2 Diabetes in Pre-Diabetic Japanese Individuals Categorized by HbA1c Levels: A Historical Cohort Study",
    "design": "日本の後ろ向きコホート",
    "population": "ベースラインHbA1c 6.5%未満の52,781人",
    "period": "5年間の発症を評価",
    "finding": "HbA1c区分ごとの糖尿病発症割合と調整ハザード比を報告。画面は割合とHRを別の指標として表示します。",
    "limit": "健診を受けた研究集団の結果です。個人の発症確率でも、運動による改善率でもありません。",
    "use": "HbA1c区分に対応する研究の集団値の表示に使用。独自スコアを発症確率に変換するものではありません。",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4390315/",
    "model_role": "study_display",
    "verification_scope": "原著本文・表1",
    "verified_on": "2026-11-16"
  },
  {
    "id": "dpp2002",
    "area": "糖代謝・生活習慣",
    "citation": "Diabetes Prevention Program Research Group, NEJM 2002",
    "title": "Reduction in the Incidence of Type 2 Diabetes with Lifestyle Intervention or Metformin",
    "design": "無作為化比較試験（RCT）",
    "population": "米国の糖尿病高リスク成人3,234人",
    "period": "平均2.8年追跡",
    "finding": "生活習慣介入群では、プラセボ群に対する糖尿病の発症率が相対的に58%低下（95%信頼区間48–66%）。介入には7%以上の減量目標と週150分以上の身体活動目標が含まれました。",
    "limit": "食事・減量・運動を組み合わせた介入です。運動だけの効果、週90分の効果、個人への58%の効果とは言えません。",
    "use": "生活習慣改善の説明に使用。発症率・寿命・資産の計算係数には追加していません。",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC1370926/",
    "model_role": "context_only",
    "verification_scope": "原著の抄録・方法・結果",
    "verified_on": "2026-11-16"
  },
  {
    "id": "edwards2023",
    "area": "血圧",
    "citation": "Edwards et al., British Journal of Sports Medicine 2023",
    "title": "Exercise training and resting blood pressure: a large-scale pairwise and network meta-analysis of randomised controlled trials",
    "design": "RCTの系統的レビュー・メタ解析",
    "population": "270試験・15,827人",
    "period": "各試験の運動介入期間は異なる",
    "finding": "有酸素運動のペアワイズ解析で、安静時血圧は平均で収縮期4.49／拡張期2.53 mmHg低下。筋力トレーニング等も評価しています。",
    "limit": "運動種目・強度・対象者・期間に違いがあります。この平均低下量から個人の心血管疾患発症率は算出できません。",
    "use": "運動と血圧の説明に使用。入力血圧や独自スコアを自動的に下げる係数にはしていません。",
    "url": "https://bjsm.bmj.com/content/57/20/1317",
    "model_role": "context_only",
    "verification_scope": "原著の抄録・解析結果",
    "verified_on": "2026-11-16"
  },
  {
    "id": "kraus2002",
    "area": "脂質",
    "citation": "Kraus et al., NEJM 2002",
    "title": "Effects of the Amount and Intensity of Exercise on Plasma Lipoproteins",
    "design": "無作為化比較試験（RCT）",
    "population": "運動不足・過体重・軽度〜中等度の脂質異常がある男女111人を無作為化。主解析84人",
    "period": "運動群約8か月／対照群6か月",
    "finding": "複数の脂質・リポ蛋白指標に運動の有益な変化がみられ、運動量が多い群で明確でした。体重を維持する条件で検討しています。",
    "limit": "LDL値の低下量や動脈硬化発症率を全員一律に示す研究ではありません。解析対象の選択にも注意が必要です。",
    "use": "脂質と運動の説明に使用。入力LDLや発症倍率への直接換算はしていません。",
    "url": "https://pubmed.ncbi.nlm.nih.gov/12421890/",
    "model_role": "context_only",
    "verification_scope": "原著の抄録・方法・結果",
    "verified_on": "2026-11-16"
  },
  {
    "id": "hallsworth2011",
    "area": "肝機能",
    "citation": "Hallsworth et al., Gut 2011",
    "title": "Resistance exercise reduces liver fat and its mediators in non-alcoholic fatty liver disease independent of weight loss",
    "design": "小規模無作為化比較試験（RCT）",
    "population": "非アルコール性脂肪性肝疾患の成人19人（運動11人・通常治療8人）",
    "period": "8週間",
    "finding": "筋力トレーニング群で肝内脂肪の相対量が約13%減少。体重には有意な変化がありませんでした。",
    "limit": "肝内脂肪を評価した研究です。AST・ALT・γ-GTPが13%改善する、肝疾患全般を治療できるとは言えません。長期の効果は未確定です。",
    "use": "肝臓と運動の説明に使用。肝酵素値や独自スコアの計算係数にはしていません。",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3152868/",
    "model_role": "context_only",
    "verification_scope": "原著の抄録・結果",
    "verified_on": "2026-11-16"
  },
  {
    "id": "greenwood2015",
    "area": "腎機能",
    "citation": "Greenwood et al., American Journal of Kidney Diseases 2015",
    "title": "Effect of exercise training on estimated GFR, vascular health, and cardiorespiratory fitness in patients with CKD: a pilot randomized controlled trial",
    "design": "パイロット無作為化比較試験（RCT）",
    "population": "進行性CKDステージ3〜4の成人20人（完了18人）",
    "period": "12か月・週3回の有酸素運動と筋力トレーニング",
    "finding": "運動耐容能等に群間差を認めましたが、腎機能の評価指標間で結果が一致せず、腎疾患の進行を抑える効果について著者は結論不確実としています。",
    "limit": "小規模試験です。運動で腎機能が回復するとは言えません。本ツールはeGFR・尿検査を扱わず、腎機能の診断や発症予測はできません。",
    "use": "腎機能について言えること・言えないことの説明に使用。発症・回復・寿命の係数にはしていません。",
    "url": "https://pubmed.ncbi.nlm.nih.gov/25236582/",
    "model_role": "context_only",
    "verification_scope": "原著の抄録・結果・限界・結論",
    "verified_on": "2026-11-16"
  },
  {
    "id": "pahor2014",
    "area": "筋骨格・身体機能",
    "citation": "Pahor et al., JAMA 2014（LIFE試験）",
    "title": "Effect of structured physical activity on prevention of major mobility disability in older adults: the LIFE study randomized clinical trial",
    "design": "多施設無作為化比較試験（RCT）",
    "population": "身体機能に制限がある70〜89歳の米国成人1,635人",
    "period": "平均2.6年追跡",
    "finding": "主要な移動能力障害は身体活動群30.1%・健康教育群35.5%。ハザード比0.82（95%信頼区間0.69–0.98）でした。",
    "limit": "高齢者の移動能力障害についての研究です。働く世代の肩・腰の痛みや筋骨格スコアへ同じ効果量を転用できません。",
    "use": "運動と身体機能の説明に使用。痛み・障害の個人予測や資産計算の係数にはしていません。",
    "url": "https://doi.org/10.1001/jama.2014.5616",
    "model_role": "context_only",
    "verification_scope": "原著の書誌・著者公開原稿の結果",
    "verified_on": "2026-11-16"
  },
  {
    "id": "li2020",
    "area": "生活習慣・疾患のない余命",
    "citation": "Li et al., BMJ 2020",
    "title": "Healthy lifestyle and life expectancy free of cancer, cardiovascular disease, and type 2 diabetes: prospective cohort study",
    "design": "前向きコホート研究",
    "population": "米国の看護師・医療専門職等111,562人",
    "period": "Nurses’ Health Study：1980–2014年／Health Professionals Follow-up Study：1986–2014年",
    "finding": "健康的な生活習慣の組み合わせと、がん・心血管疾患・2型糖尿病のない余命が長いこととの関連を報告しています。",
    "limit": "観察研究で、因果関係や日本人個人の健康寿命を保証しません。3疾患のない余命と「日常生活に制限がない期間」は定義が異なります。",
    "use": "健康年数シナリオの背景説明です。本ツールの年数計算全体を検証した研究ではありません。",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7190036/",
    "model_role": "model_context",
    "verification_scope": "原著本文・対象集団・研究デザイン",
    "verified_on": "2026-11-16"
  },
  {
    "id": "hackshaw2018",
    "area": "喫煙・心血管",
    "citation": "Hackshaw et al., BMJ 2018",
    "title": "Low cigarette consumption and risk of coronary heart disease and stroke: meta-analysis of 141 cohort studies in 55 study reports",
    "design": "コホート研究の系統的レビュー・メタ解析",
    "population": "55報に含まれる141コホート研究",
    "period": "研究ごとに追跡期間が異なる",
    "finding": "少量喫煙でも冠動脈疾患・脳卒中リスクとの関連があり、心血管の超過リスクは喫煙本数に単純比例しませんでした。",
    "limit": "観察研究の統合です。本数を減らした直後の改善率や、個人の発症確率・健康年数・医療費を直接計算するものではありません。",
    "use": "喫煙本数とリスクの非線形性の参考です。本ツールの本数間の補間・点数への換算は独自の仮定です。",
    "url": "https://www.bmj.com/content/360/bmj.j5855",
    "model_role": "model_shape_context",
    "verification_scope": "原著の抄録・結果",
    "verified_on": "2026-11-16"
  }
];
if(typeof module!=='undefined'&&module.exports){module.exports=BP_RESEARCH;}else{
 const reportGroups=[['kawahara2015','dpp2002'],['edwards2023'],['kraus2002'],['hallsworth2011'],['greenwood2015'],['pahor2014']];
 function annotateReport(){
  document.querySelectorAll('#raRisks .rr-n').forEach((label,i)=>{if(label.querySelector('.ra-ref-link'))return;for(const id of reportGroups[i]||[]){const j=BP_RESEARCH.findIndex(s=>s.id===id),a=document.createElement('a');a.className='ra-ref-link';a.href=BP_RESEARCH[j].url;a.target='_blank';a.rel='noopener';a.textContent=`[${j+1}]`;label.append(' ',a);}});
  let holder=document.getElementById('raSources');if(!holder){holder=document.createElement('div');holder.id='raSources';holder.className='ra-sources';document.getElementById('raFoot').before(holder);}
  holder.replaceChildren();const title=document.createElement('strong');title.textContent='研究出典｜領域の説明・背景（計算モデル全体の検証ではありません）';holder.append(title);
  for(let i=0;i<BP_RESEARCH.length;i++){const study=BP_RESEARCH[i],a=document.createElement('a');a.href=study.url;a.target='_blank';a.rel='noopener';a.textContent=`[${i+1}] ${study.citation}`;holder.append(a);}
 }
 window.BPResearch={studies:BP_RESEARCH,annotateReport,createDetails(ids,label){
  const details=document.createElement('details');details.className='research-details';
  const summary=document.createElement('summary');summary.textContent=label||`根拠となる研究を見る（${ids.length}本）`;details.append(summary);
  for(const id of ids){const study=BP_RESEARCH.find(s=>s.id===id);if(!study)continue;
   const article=document.createElement('article');article.className='research-study';
   const heading=document.createElement('h4');heading.textContent=study.citation;article.append(heading);
   const meta=document.createElement('p');meta.className='research-meta';meta.textContent=`${study.design}｜${study.population}｜${study.period}`;article.append(meta);
   for(const [name,value] of [['研究で分かったこと',study.finding],['読み取る際の限界',study.limit],['このツールでの扱い',study.use]]){const p=document.createElement('p');const b=document.createElement('strong');b.textContent=name+'：';p.append(b,document.createTextNode(value));article.append(p);}
   const link=document.createElement('a');link.href=study.url;link.target='_blank';link.rel='noopener';link.textContent='出典：'+study.title;article.append(link);details.append(article);
  }
  const close=document.createElement('button');close.type='button';close.className='research-close';close.textContent='研究の説明を閉じる';
  close.addEventListener('click',()=>{details.open=false;summary.focus({preventScroll:true});summary.scrollIntoView({block:'center',behavior:'auto'});});details.append(close);
  return details;
 }};
 annotateReport();
}
