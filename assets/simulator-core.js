
'use strict';

// ═══════════════════════════════════════════════════
// 0. 公開期間の締切（有効期限）チェック
// ═══════════════════════════════════════════════════
// 2027年12月31日（JST）をもって公開終了。2028/1/1 00:00 JST 以降は終了画面を表示。
const PUBLISH_END = new Date('2028-01-01T00:00:00+09:00');
if (new Date() >= PUBLISH_END) {
  document.getElementById('expiryOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

// ═══════════════════════════════════════════════════
// 1. 定数・テーブル定義
// ═══════════════════════════════════════════════════

// 国税庁 令和6年分 民間給与実態統計調査 年齢別平均年収(万円)
const INCOME_TABLE = {
  male:   {25:446,30:517,35:566,40:612,45:653,50:693,55:735,60:545,65:430},
  female: {25:360,30:383,35:393,40:399,45:403,50:408,55:410,60:340,65:300}
};

// 厚生労働省「令和5年度 厚生年金保険・国民年金事業の概況」
// 老齢厚生年金 平均月額 → 年額
const PENSION = {male:16.7*12, female:10.9*12}; // 万円/年

// 総務省 家計調査 2022-23 年代別貯蓄率（可処分所得比）
const SAVING_RATE = {
  u30:0.20, u40:0.18, u50:0.13, u60:0.13, u65:0.10, pension:0.05
};

// 総務省「家計調査」令和4年 65歳以上無職世帯の消費支出（万円/年）
// 男性（2人世帯想定）: 約27万/月 × 12 = 324万円
// 女性（単身世帯想定）: 約15.5万/月 × 12 = 186万円
const RETIREMENT_SPENDING = { male: 324, female: 186 };

// ═══════════════════════════════════════════════════
// 2. UI初期化
// ═══════════════════════════════════════════════════
const ageEl = document.getElementById('age');
for(let a=20;a<=79;a++){
  const o=document.createElement('option');
  o.value=a; o.textContent=`${a}歳`;
  if(a===40)o.selected=true;
  ageEl.appendChild(o);
}

// ═══════════════════════════════════════════════════
// 3. バリデーション
// ═══════════════════════════════════════════════════
const RULES={
  height:{min:100,max:250},weight:{min:20,max:300},waist:{min:40,max:200},
  sbp:{min:60,max:260},dbp:{min:30,max:160},glucose:{min:40,max:600},
  hba1c:{min:3,max:15},ldl:{min:30,max:400},hdl:{min:15,max:150},tg:{min:20,max:1500},
  ast:{min:5,max:1000},alt:{min:5,max:1000},ggt:{min:5,max:2000}
};

function n(id){const v=document.getElementById(id)?.value;return(v===''||v==null)?null:Number(v);}

function validateField(id){
  const r=RULES[id];if(!r)return true;
  const v=n(id),el=document.getElementById(id),err=document.getElementById('e-'+id);
  if(v===null){el.classList.remove('err');if(err)err.classList.remove('show');return true;}
  if(!Number.isFinite(v)||!el.checkValidity()||v<r.min||v>r.max){el.classList.add('err');if(err)err.classList.add('show');return false;}
  el.classList.remove('err');if(err)err.classList.remove('show');return true;
}
Object.keys(RULES).forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener('blur',()=>validateField(id));
});

// 試算精度メーター：健診項目を入れるほど 簡易→標準→詳細 に上昇（即時フィードバック）
function updatePrecisionMeter(){
 const keys=Object.keys(RULES);const entered=keys.filter(id=>n(id)!==null).length;
 const lvl=document.getElementById('pmLevel');if(lvl){lvl.textContent=`${entered}/${keys.length}項目`;lvl.dataset.lv='入力状況';}
 const fill=document.getElementById('pmFill');if(fill)fill.style.width=(entered/keys.length*100)+'%';
 const note=document.getElementById('pmNote');if(note)note.textContent='未入力の検査項目は評価できません。入力数は診断や予測の精度を示すものではありません。';
}
Object.keys(RULES).forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener('input',updatePrecisionMeter);
});
updatePrecisionMeter();
function validateAll(){
 let ok=true;Object.keys(RULES).forEach(id=>{if(!validateField(id))ok=false;});
 ['income','assets','medicalShare','incomeLossAssumption'].forEach(id=>{const el=document.getElementById(id);if(!el)return;const bad=!el.checkValidity();if(bad){const details=el.closest('details');if(details)details.open=true;}el.classList.toggle('err',bad);el.setAttribute('aria-invalid',String(bad));if(bad){el.reportValidity();ok=false;}});
 return ok;
}

// Symptom selection was removed; checkup/lifestyle inputs remain the model inputs.
function syms(){return [];}

// ═══════════════════════════════════════════════════
// 3.5 運動頻度（週の回数）の用量反応モデル
// ═══════════════════════════════════════════════════
// Coleman CJ, McDonough DJ, Pope ZC, Pope CA.
// "Dose-response association of aerobic and muscle-strengthening physical activity with mortality:
//  a national cohort study of 416,420 US adults." Br J Sports Med. 2022.
// 有酸素運動：週1時間でHR 0.85（死亡リスク15%減）、週3時間でHR 0.73（27%減、以降頭打ち）。
// 1回=30分の運動と仮定し、週の運動「時間」に換算してHRを補間する。
function exerciseHrByHours(hoursPerWeek){
  const h=Math.max(0,hoursPerWeek);
  if(h<=1) return 1.00+(0.85-1.00)*h;
  if(h<=3) return 0.85+(0.73-0.85)*((h-1)/2);
  return 0.73;
}
// habitのhp満点(14)を基準に、エビデンス曲線の形状だけを借りて「残存リスク量」を算出する関数。
// 0時間で14相当、週3時間（頭打ち）で0相当となるよう正規化。
function exerciseBenefitRemainingByHours(hoursPerWeek){
  const hr=exerciseHrByHours(hoursPerWeek);
  const benefitFraction=(1.00-hr)/(1.00-0.73);
  return 14*(1-benefitFraction);
}
// 運動習慣の選択肢（ほぼない/①〜⑥）を、実際の週の運動時間（時間/週）に直接対応させる。
// 「1回30分」「1回60分」×週1〜3回という実際の時間から算出した値なので近似ではない。
const HABIT_HOURS={
  none:0,
  '30x1':0.5,'30x2':1.0,'30x3':1.5,
  '60x1':1.0,'60x2':2.0,'60x3':3.0
};

// 運動投資ROI（受診→運動習慣→投資合理性→CTA）の前提
// 習慣化に必要な回数：Lally et al. Eur J Soc Psychol 2010（習慣形成の中央値66日）を参考に週2回×約3ヶ月＝24回
const HABIT_FORM_SESSIONS = 24;
const PT_PRICE_30 = 5000;   // 30分1回の単価（円）
const PT_PRICE_60 = 10000;  // 60分1回の単価（円）

// ═══════════════════════════════════════════════════
// 3.6 喫煙本数の用量反応モデル
// ═══════════════════════════════════════════════════
// Hackshaw AK, Morris JK, Grant A, Field DJ, Lee L, Zhang Q.
// "Low cigarette consumption and risk of coronary heart disease and stroke:
//  meta-analysis of 141 cohort studies in 55 study reports." BMJ. 2018;360:j5855.
// 1日1本の喫煙で冠動脈疾患リスクが男性RR1.48・女性RR1.57、1日20本でRR2.04・2.84。
// つまり1本だけでも、20本吸った場合の超過リスクの46%（男性）・31%（女性）に達する
// ＝本数を増やしても被害は直線的には増えず、ごく少量でも影響の大半が生じる非線形な関係。
// 本数〜超過リスク割合はlog(本数)に対してほぼ線形（対数用量反応）として1〜20本の間を補間する。
function smokingExcessFraction(cigsPerDay, gender){
  const c=Math.max(0,cigsPerDay);
  if(c<=0) return 0;
  const f1=gender==='female'?0.31:0.46; // 1本/日の時点で20本相当の超過リスクに対して占める割合
  if(c<=1) return f1*c;
  if(c>=20) return 1.0;
  return f1+(1-f1)*(Math.log(c)/Math.log(20));
}

// ═══════════════════════════════════════════════════
// 4. リスクスコア計算
// ═══════════════════════════════════════════════════
/* storage安全ラッパ：プライベートブラウズ等でstorageが例外でも落ちない（本番堅牢化） */
var _fwSS=null,_fwLS=null;
try{ _fwSS=window.sessionStorage; }catch(e){}
try{ _fwLS=window.localStorage; }catch(e){}
var _fwMem={};
function ssGet(k){ k=(window.BP_STORAGE_NAMESPACE||'')+k; try{ if(_fwSS) return _fwSS.getItem(k); }catch(e){} return (('s:'+k) in _fwMem)? _fwMem['s:'+k] : null; }
function ssSet(k,v){ k=(window.BP_STORAGE_NAMESPACE||'')+k; try{ if(_fwSS){ _fwSS.setItem(k,v); return; } }catch(e){} _fwMem['s:'+k]=v; }
function lsGet(k){ k=(window.BP_STORAGE_NAMESPACE||'')+k; try{ if(_fwLS) return _fwLS.getItem(k); }catch(e){} return (('l:'+k) in _fwMem)? _fwMem['l:'+k] : null; }
function lsSet(k,v){ k=(window.BP_STORAGE_NAMESPACE||'')+k; try{ if(_fwLS){ _fwLS.setItem(k,v); return; } }catch(e){} _fwMem['l:'+k]=v; }

function computeRisk(overrides){
  overrides=overrides||{};
  const gender=document.getElementById('gender').value;
  const age=Number(document.getElementById('age').value);
  const habit=overrides.habit||document.getElementById('habit').value;
  const h=n('height');
  const wRaw=n('weight');
  // 減量目標(kg)：安全のため現体重の70%を下限にクランプ
  const w=(wRaw&&overrides.weightLossKg)?Math.max(wRaw-overrides.weightLossKg,wRaw*0.7):wRaw;
  const bmi=(h&&w)?w/Math.pow(h/100,2):null;
  const waist=n('waist'),sbp=n('sbp');
  const glucose=n('glucose'),hba1c=n('hba1c');
  const ldl=n('ldl');
  const smoking=overrides.smoking||document.getElementById('smoking').value;
  const sm=syms();const symN=sm.includes('no')?0:sm.length;
  const exerciseHours = overrides.exerciseHoursPerWeek!=null ? Math.max(0,overrides.exerciseHoursPerWeek)
    : overrides.sessionsPerWeek!=null ? Math.max(0,overrides.sessionsPerWeek)*0.5
    : (HABIT_HOURS[habit]??0);
  const hp=exerciseBenefitRemainingByHours(exerciseHours);
  // 現在喫煙中の場合のみ、1日の本数（未入力時は20本＝従来通りの想定）で用量反応を連続的に反映
  const cigsPerDay=overrides.cigsPerDay??n('cigCount');
  const smokeFrac=smoking==='current'?smokingExcessFraction(cigsPerDay==null?20:cigsPerDay,gender):0;
  const smkB=smoking==='current'?15*smokeFrac:smoking==='past'?7:0; // 血圧・心血管への喫煙加算
  const smkL=smoking==='current'?10*smokeFrac:smoking==='past'?4:0; // 脂質・動脈硬化への喫煙加算
  const ab=Math.max(0,(age-30)*0.9);const sa=gender==='male'?3:0;
  // BMI加算：通常は従来通りbmi>=25で満点（現在のリスク判定・警告基準は変えない）。
  // ただし減量シミュレーション（体重スライダー）使用時だけは22〜35を連続的に滑らかに補間し、
  // 「体重を少し減らしても数値が動かない」崖を無くして減量効果を連続的に反映する。
  const bmiRamp=overrides.weightLossKg
    ? (bmi?Math.max(0,Math.min(1,(bmi-22)/13)):0)
    : (bmi&&bmi>=25?1:0);

  // 糖代謝
  let G=ab+sa+hp;
  G+=12*bmiRamp;
  if(waist&&((gender==='male'&&waist>=85)||(gender==='female'&&waist>=90)))G+=10;
  if(glucose&&glucose>=100)G+=glucose>=126?25:14;
  if(hba1c&&hba1c>=5.6)G+=hba1c>=6.5?26:hba1c>=6.2?20:hba1c>=6.0?16:hba1c>=5.8?10:6;
  if(sm.includes('ft'))G+=5;
  if(sm.includes('af'))G+=4; // 食後の眠気→インスリン抵抗性

  // 血圧
  let B=ab+hp+2+smkB;
  if(sbp&&sbp>=130)B+=sbp>=160?26:sbp>=150?20:sbp>=140?15:8;
  B+=8*bmiRamp;
  if(waist&&((gender==='male'&&waist>=85)||(gender==='female'&&waist>=90)))B+=8;
  if(sm.includes('hd'))B+=4;if(sm.includes('st'))B+=5;
  if(sm.includes('pf'))B+=6; // 息切れ・動悸

  // 脂質
  let L=ab+hp+1+smkL;
  if(ldl&&ldl>=120)L+=ldl>=160?22:ldl>=140?14:8;
  L+=8*bmiRamp;
  if(waist&&((gender==='male'&&waist>=85)||(gender==='female'&&waist>=90)))L+=8;

  // 肝機能（入力値なし時は年齢・習慣ベースで推定）
  let V=Math.max(0,ab-5)+hp;
  if(sm.includes('dr'))V+=10;
  V+=10*bmiRamp;

  // 腎機能（入力値なし時は年齢・血圧・血糖ベースで推定）
  let K=ab+1;
  if(sbp&&sbp>=130)K+=8;
  if(glucose&&glucose>=100)K+=7;
  if(hba1c&&hba1c>=5.6)K+=7;

  // 筋骨格
  let M=10+symN*8+hp;
  if(sm.includes('ns'))M+=12;if(sm.includes('bp'))M+=14;
  if(sm.includes('kn'))M+=14; // 膝・関節の痛み
  if(sm.includes('sw'))M+=6;  // むくみ
  if(sm.includes('pf'))M+=8;  // 息切れ・動悸
  if(sm.includes('fc'))M+=8;if(sm.includes('sl'))M+=8;

  const risks={
    glucose:Math.min(100,Math.round(G)),
    bp:Math.min(100,Math.round(B)),
    lipid:Math.min(100,Math.round(L)),
    liver:Math.min(100,Math.round(V)),
    kidney:Math.min(100,Math.round(K)),
    musculo:Math.min(100,Math.round(M))
  };

  const entered=Object.keys(RULES).filter(id=>n(id)!==null).length;
  const precision=entered+'項目入力';

  // 総合医療リスクスコア
  const medScore=Math.round((risks.glucose+risks.bp+risks.lipid+risks.liver+risks.kidney+risks.musculo*0.8)/5.8);

  return{gender,age,habit,exerciseHours,smoking,cigsPerDay:smoking==='current'?(cigsPerDay==null?20:cigsPerDay):null,
    bmi,risks,entered,precision,medScore,hba1c,sbp,ldl,sm,waist,glucose};
}

// ═══════════════════════════════════════════════════
// 5. 経年リスク増加（論文準拠）
// ═══════════════════════════════════════════════════
function computeTrend(s){
 const rows=[],srcs=[];
 if(s.hba1c!==null&&s.hba1c>=6.5){
   rows.push({label:'HbA1cの入力値',val:'6.5%以上。研究の対象区分外です。健診の判定・医療機関の案内を確認してください。',ok:false});
 }else if(s.hba1c!==null){
   const h=s.hba1c;
   if(Math.abs(h*10-Math.round(h*10))>0.00001){
     rows.push({label:'研究との照合',val:'この研究は小数第1位のHbA1c区分です。健診票の桁数・単位を確認してください。個人の確率へ換算はしません。',ok:false});
   }else{
     const band=h>=6.4?['6.4',67.8,48.7,'40.8–58.1']:h>=6.2?['6.2–6.3',51.6,26.3,'23.3–30.1']:h>=6?['6.0–6.1',27.5,8.8,'8.0–10.1']:h>=5.8?['5.8–5.9',13.8,3.4,'2.9–3.7']:h>=5.6?['5.6–5.7',8.9,2.3,'2.0–2.5']:['5.5以下',3.6,1,null];
     rows.push({label:`研究の集団値｜HbA1c ${band[0]}%群`,val:`5年間の糖尿病発症割合 ${band[1]}%（個人の発症確率ではありません）`,ok:h<5.6});
     if(band[2]!==1)rows.push({label:'研究の比較指標｜調整ハザード比（HR）',val:`HbA1c 5.5%以下群との比較 ${band[2]}倍（95%信頼区間 ${band[3]}）。発症割合の比とは異なります。`,ok:false});
     srcs.push('Kawahara et al., PLoS ONE 2015：日本人52,781人、5年間。研究対象は開始時HbA1c 6.5%未満・糖尿病未診断等。観察研究の関連であり、改善効果の証明ではありません。');
   }
 }else{
   rows.push({label:'研究の集団データ',val:'HbA1cを入力すると、該当する区分の発症割合と比較指標を表示します。未入力のため研究との照合はできません。',ok:true});
 }
 return {rows,srcs};
}

// ═══════════════════════════════════════════════════
// 6. 発症確率 → 3フェーズ医療費（年間）
// ═══════════════════════════════════════════════════
// 疾患別1人当たり年間医療費（厚労省 令和4年度 国民医療費より算出）
const PHASE_COST={
  // [境界域, 発症後, 合併症期]（万円/年）
  diabetes: [3, 22, 50],
  hyp:      [3, 11, 30],
  cvd:      [5, 61,100],
  nafld:    [3, 18, 50],
  ckd:      [3, 30,136],
};

// スコアから発症確率（5年ベースを年率換算）
function getAnnualRisk(score, type){
  // PMC4390315ベース（HbA1cデータ）の年率換算
  // 糖代謝: スコア0-39→年率0.7%, 40-69→年率2.9%, 70-89→年率9.2%, 90-100→年率30%
  // 他疾患は同様のステップ関数で近似
  if(score>=90) return type==='diabetes'?0.44:0.30;
  if(score>=70) return type==='diabetes'?0.092:0.10;
  if(score>=40) return type==='diabetes'?0.029:0.04;
  return type==='diabetes'?0.007:0.02;
}

// フェーズ判定（スコアと累積年数で動的に変化）。
// 「5年以上経過すると1段階進行しうる」という上限つきの進行ルールはそのまま維持し、
// 年数だけが際限なく費用を押し上げてしまわないようにするための判定にのみ使う。
function phaseOf(score, yearsElapsed){
  if(score>=90||(score>=70&&yearsElapsed>=5)) return 2; // 合併症期
  if(score>=70||(score>=40&&yearsElapsed>=5)) return 1; // 発症後
  if(score>=40) return 0; // 境界域
  return -1; // リスクなし
}

// 閾値(edge)の手前bandポイントだけをlo→hiで滑らかに繋ぎ、それ以外は元通りフラットにするヘルパー。
// 閾値からdistantな値まで一律に補間すると「まだ全然低リスクの人」まで数値が底上げされてしまうため、
// 崖の直前だけをなだらかにする狭い遷移帯として使う。
function narrowRamp(x, edge, band, lo, hi){
  const t=Math.max(0,Math.min(1,(x-(edge-band))/band));
  return lo+(hi-lo)*t;
}

// スコア（0〜100）を年間医療費に連続的に変換する。
// 元々は40/70/90点で医療費が段階的に切り替わる階段状のモデルだったが、
// 同じ段の中では数値がどれだけ改善しても金額が1円も動かないため、
// 「どの段にいるか」はphaseOfの上限つきルールで判定しつつ、段の中身（スコア→費用）は
// 次の段の値へ向けて連続的に補間する。ph<0（リスクなし域）は閾値の手前だけを狭く補間し、
// 明らかに低リスクな人まで底上げされないようにする。
function interpCost(score, yearsElapsed, costLevels){
  const ph=phaseOf(score,yearsElapsed);
  if(ph<0) return narrowRamp(score,40,8,0,costLevels[0]);
  if(ph===0){
    const t=Math.max(0,Math.min(1,(score-40)/30));
    return costLevels[0]+(costLevels[1]-costLevels[0])*t;
  }
  if(ph===1){
    const t=Math.max(0,Math.min(1,(score-70)/20));
    return costLevels[1]+(costLevels[2]-costLevels[1])*t;
  }
  return costLevels[2];
}

// 複数疾患の乗法補正（JACC 2010メタ分析）。
// 元は「70点以上が何個あるか」で1.0/1.4/2.0倍に切り替わる階段状だったが、
// 60〜80点の間で各疾患の重症度を0〜1に連続化し、その合計値で滑らかに補間する。
function multiDiseaseMultiplier(risks){
  const sevSum=Object.values(risks).reduce((s,v)=>s+Math.max(0,Math.min(1,(v-60)/20)),0);
  if(sevSum>=3) return 2.0;
  if(sevSum>=2) return 1.4+(sevSum-2)*0.6;
  return 1.0+(sevSum/2)*0.4;
}

// プレゼンティーイズム損失率（元は0.03/0.10/0.20の3段階）。
// 40点・70点それぞれの手前だけを狭く滑らかにし、閾値から離れた低リスクの人には影響させない。
function ptLossRateFor(medScore){
  if(medScore<40) return narrowRamp(medScore,40,8,0.03,0.10);
  if(medScore<70) return narrowRamp(medScore,70,8,0.10,0.20);
  return 0.20;
}

// ═══════════════════════════════════════════════════
// 7. 年収・年金モデル
// ═══════════════════════════════════════════════════
function getIncomeCurve(gender, currentAge, userIncome){
  const tbl=INCOME_TABLE[gender];

  // 国税庁データから年齢補間（〜59歳）
  const brackets=[25,30,35,40,45,50,55];
  function peakIncome(age){
    if(age>=60) return tbl[55]; // 55〜59歳ピークを基準に計算
    const b=brackets.filter(b=>b<=age).pop()||25;
    const nb=brackets.find(b=>b>age)||55;
    if(b===nb) return tbl[b];
    const ratio=(age-b)/(nb-b);
    return tbl[b]+(tbl[nb]-tbl[b])*ratio;
  }

  // ユーザー入力倍率（現在年齢の平均値との比）
  const currentAvg=peakIncome(Math.min(currentAge,59));
  const scale=userIncome!==null&&userIncome!==undefined?userIncome/currentAvg:1.0;

  return function(age){
    // ─── Phase 1: 現役（〜59歳）───
    if(age<60){
      return peakIncome(age)*scale;
    }
    // ─── Phase 2: 定年再雇用（60〜64歳）───
    // 国税庁データ：55〜59歳ピーク→60〜64歳は約74%に低下
    // ユーザー倍率を維持しつつ、平均的な定年後減収率を適用
    if(age>=60&&age<65){
      const peak=peakIncome(59)*scale;
      // 60歳から線形に減収：60歳=80%、64歳=70%（国税庁 60-64歳平均/55-59歳平均比）
      const ratio=0.80-(age-60)*0.02;
      return peak*ratio;
    }
    // ─── Phase 3: 年金（65歳〜）───
    // 厚労省「令和5年度 厚生年金保険・国民年金事業の概況」
    // 男性：16.7万円/月×12 = 200.4万円/年
    // 女性：10.9万円/月×12 = 130.8万円/年
    return PENSION[gender];
  };
}

function savingRateForAge(age){
  if(age>=65) return SAVING_RATE.pension;   // 年金生活：貯蓄率5%
  if(age>=60) return SAVING_RATE.u65;       // 定年再雇用：10%
  if(age>=50) return SAVING_RATE.u60;       // 50代：13%
  if(age>=40) return SAVING_RATE.u50;       // 40代：13%
  if(age>=30) return SAVING_RATE.u40;       // 30代：18%
  return SAVING_RATE.u30;                   // 20代：20%
}

// ═══════════════════════════════════════════════════
// 8. 資産シミュレーション（現在〜80歳）
// ═══════════════════════════════════════════════════
const INVEST_RATE=0.03; // 独自の試算仮定。保証利回りではない。

// 資産推移を1本分試算する共通ロジック（zeroRisk=trueなら疾患リスクゼロの理想値）
function projectAsset(riskState,gender,startAge,userIncome,userAssets,zeroRisk){
  const incomeFn=getIncomeCurve(gender,startAge,userIncome);
  const mMult=multiDiseaseMultiplier(riskState.risks);
  const ptLossRate=zeroRisk?0:Math.min(100,Math.max(0,n("incomeLossAssumption")||0))/100;

  let asset=userAssets;
  const arr=[];
  let cumulativePT=0;
  let cumulativeMed=0;

  for(let age=startAge;age<=80;age++){
    arr.push(Math.round(asset));
    if(age===80)break; // The ending balance is at age 80; do not accrue an extra year.
    const inc=incomeFn(age);
    const sr=savingRateForAge(age);

    if(zeroRisk){
      const saving = age>=65 ? inc - RETIREMENT_SPENDING[gender] : inc*sr;
      asset=asset*(1+INVEST_RATE)+saving;
      continue;
    }

    // 医療費（スコアに応じて連続的に算出）
    const yrsElapsed=age-startAge;

    const gMed=interpCost(riskState.risks.glucose,yrsElapsed,PHASE_COST.diabetes)*mMult;
    const bMed=interpCost(riskState.risks.bp,yrsElapsed,[PHASE_COST.hyp[0],PHASE_COST.hyp[1],PHASE_COST.cvd[2]])*mMult;
    const lMed=interpCost(riskState.risks.lipid,yrsElapsed,[PHASE_COST.hyp[0],PHASE_COST.hyp[1],PHASE_COST.cvd[2]])*0.7;
    const vMed=interpCost(riskState.risks.liver,yrsElapsed,PHASE_COST.nafld)*mMult;
    const kMed=interpCost(riskState.risks.kidney,yrsElapsed,PHASE_COST.ckd)*mMult;

    const annualMed=(gMed+bMed+lMed+vMed+kMed)*Math.min(100,Math.max(0,n("medicalShare")??30))/100;
    cumulativeMed+=annualMed;

    // プレゼンティーイズム損失（65歳未満のみ）
    const ptLoss=age<65?inc*ptLossRate:0;
    cumulativePT+=ptLoss;

    const saving = age>=65
      ? (inc - RETIREMENT_SPENDING[gender]) - annualMed
      : (inc-ptLoss)*sr - annualMed;
    asset=asset*(1+INVEST_RATE)+saving;
  }

  return{arr,cumulativePT:Math.round(cumulativePT),cumulativeMed:Math.round(cumulativeMed),ptLossRate,mMult};
}

function simulate(state){
  const gender=state.gender;
  const startAge=state.age;
  const userIncome=n('income');
  const userAssets=n('assets')||0;

  const blueP=projectAsset(state,gender,startAge,userIncome,userAssets,true);
  const redP=projectAsset(state,gender,startAge,userIncome,userAssets,false);

  const ages=[];
  for(let age=startAge;age<=80;age++) ages.push(age);

  const blue80=blueP.arr[blueP.arr.length-1];
  const red80=redP.arr[redP.arr.length-1];
  const diff80=blue80-red80;

  // 投資複利機会損失（差分が運用されなかった場合）
  const years=80-startAge;
  const compoundLoss=redP.cumulativePT*Math.pow(1+INVEST_RATE,years/2)-redP.cumulativePT;

  return{
    ages,blueArr:blueP.arr,redArr:redP.arr,
    blue80,red80,diff80,
    cumulativePT:redP.cumulativePT,
    cumulativeMed:redP.cumulativeMed,
    compoundLoss:Math.max(0,Math.round(compoundLoss)),
    ptLossRate:redP.ptLossRate,medScore:state.medScore,mMult:redP.mMult
  };
}

// ═══════════════════════════════════════════════════
// 5b. 健康寿命モデル（日本人コホート最優先・全係数に出典）
//   出力① 予測残り健康寿命（健康維持 vs 現状放置 ＝ 失う健康年数）
//   出力② 改善アクション別の延伸年数
//   原則: 集団平均・相対リスクベースの試算。点推定でなくレンジ表示（過剰精度を装わない）。
//   基準(delta=0)= 非喫煙・SBP<120・正常血糖・BMI21〜27・活発。いずれも修正可能因子。
// ═══════════════════════════════════════════════════
// 健康寿命ベースライン（厚労省 2022, 日常生活に制限のない期間） 出典: e-ヘルスネット
const HALE_BIRTH={male:72.57,female:75.45};
// 各因子 → 健康年数の増減（年, ≤0）
function ls_dSmoke(s){
  if(s.smoking==='never'||!s.smoking) return 0;
  if(s.smoking==='past') return -1.7;                 // 禁煙者: 40歳平均余命 -1.7y (NIPPON DATA80, J Epidemiol 2007)
  const c=(s.cigsPerDay==null?20:s.cigsPerDay);
  const frac=Math.min(1,c/20);
  const heavy=c>40?Math.min(1,(c-40)/40)*1.5:0;
  return -(1.5+2.0*frac+heavy);                       // 20本/日で -3.5y (NIPPON DATA80), 重喫煙で最大 ~ -5y
}
function ls_dBP(s){
  if(s.sbp==null||s.sbp<120) return 0;
  const b=s.gender==='male'?-2.2:-2.9;                // 高血圧(≥140)で 男-2.2/女-2.9y (NIPPON DATA80, 24年追跡)
  const scale=(s.sbp-120)/20;                         // 140で1.0
  const factor=scale<=1?scale:1+(s.sbp-140)/20*0.6;   // ≥140は加速 (PSC Lancet 2002 log-linear)
  return b*Math.min(2.4,Math.max(0,factor));
}
function ls_dGlucose(s){
  const full=s.gender==='male'?-7.2:-10.3;            // 確立糖尿病の死亡年齢差 (日本糖尿病学会 2011-2020調査)
  let sev=0;
  if(s.hba1c!=null){
    if(s.hba1c>=6.5) sev=Math.max(sev,Math.min(1.2,1+(s.hba1c-6.5)/3));
    else if(s.hba1c>=5.6) sev=Math.max(sev,(s.hba1c-5.6)/0.9*0.35);   // 境界域は最大0.35
  }
  if(s.glucose!=null){
    if(s.glucose>=126) sev=Math.max(sev,1);
    else if(s.glucose>=100) sev=Math.max(sev,(s.glucose-100)/26*0.35);
  }
  return full*Math.min(1.2,sev);
}
function ls_dBMI(s){
  if(s.bmi==null) return 0;
  let excess=0;
  if(s.bmi>27) excess=(s.bmi-27)/5; else if(s.bmi<20) excess=(20-s.bmi)/5;  // nadir 21〜27 (国立がん 35万人プール解析)
  let yrs=-1.6*excess;                                // BMI+5でHR死亡+31% → 健康年数 ~ -1.6y/5 (保守的換算, J Epidemiol 2011)
  if(s.waist!=null&&((s.gender==='male'&&s.waist>=85)||(s.gender==='female'&&s.waist>=90))) yrs-=0.6;
  return Math.max(-4,yrs);
}
function ls_dActivity(s){
  const hrs=s.exerciseHours||0;
  const frac=1-Math.exp(-hrs/1.5);
  return -4.0*(1-frac);                               // 不活発 -4y 〜 活発 0 (Age & Ageing 2018: 健康な期間+6.3yを保守化 + 用量反応メタ解析)
}
function ls_dLipid(s){
  if(s.ldl==null||s.ldl<140) return 0;
  return -Math.min(1.5,(s.ldl-140)/40*0.8);           // 高LDLは主にCVD経由で計上（NIPPON DATA80 は総コレを含む）
}
// 複合は加算でなく飽和：高血圧+肥満+喫煙+糖尿病で健康寿命 男-9.7/女-10.1y (NIPPON DATA90, 20年追跡) をアンカーに
function ls_saturate(rawLoss,gender){
  const Lmax=gender==='male'?12.5:13.5;
  return Lmax*(1-Math.exp(-Math.max(0,rawLoss)/Lmax));
}
function computeLifespan(s){
  const g=s.gender;
  const base=Math.max(4,HALE_BIRTH[g]-s.age);         // 現年齢からの残り健康年数(集団平均・日常生活に制限のない期間基準)
  const deltas={
    smoke:ls_dSmoke(s), bp:ls_dBP(s), glucose:ls_dGlucose(s),
    bmi:ls_dBMI(s), activity:ls_dActivity(s), lipid:ls_dLipid(s)
  };
  const rawLoss=-(deltas.smoke+deltas.bp+deltas.glucose+deltas.bmi+deltas.activity+deltas.lipid);
  const loss=ls_saturate(rawLoss,g);                  // 失う健康年数(飽和後)
  const maintainRemain=base;
  const neglectRemain=Math.max(2,base-loss);
  function lossWithout(key){                           // その因子だけ健康側に戻したときの残損失
    let r=0; for(const k in deltas){ if(k!==key) r+=deltas[k]; }
    return ls_saturate(-r,g);
  }
  const A=[];
  if(s.smoking==='current'||s.smoking==='past') A.push({key:'smoke',label:s.smoking==='current'?'禁煙する':'禁煙を続ける',years:+(loss-lossWithout('smoke')).toFixed(1),src:'NIPPON DATA80 (J Epidemiol 2007)'});
  if((s.exerciseHours||0)<3) A.push({key:'activity',label:'運動習慣をつける（週3回目安）',years:+(loss-lossWithout('activity')).toFixed(1),src:'Age & Ageing 2018 ほか'});
  if(s.bmi!=null&&s.bmi>27) A.push({key:'bmi',label:'適正体重に近づける',years:+(loss-lossWithout('bmi')).toFixed(1),src:'国立がん研究センター プール解析 (J Epidemiol 2011)'});
  if(s.sbp!=null&&s.sbp>=130) A.push({key:'bp',label:'血圧を下げる',years:+(loss-lossWithout('bp')).toFixed(1),src:'NIPPON DATA80 (24年追跡)'});
  if((s.hba1c!=null&&s.hba1c>=5.6)||(s.glucose!=null&&s.glucose>=100)) A.push({key:'glucose',label:'血糖を改善する',years:+(loss-lossWithout('glucose')).toFixed(1),src:'日本糖尿病学会 2011-2020調査'});
  A.sort((a,b)=>b.years-a.years);
  const band=Math.max(1.0,loss*0.25);                 // レンジ(±)：集団平均ベースの不確実性を明示
  return {
    base:+base.toFixed(1), deltas, rawLoss:+rawLoss.toFixed(1),
    loss:+loss.toFixed(1), lossLo:+Math.max(0,loss-band).toFixed(1), lossHi:+(loss+band).toFixed(1),
    maintainRemain:+maintainRemain.toFixed(1), neglectRemain:+neglectRemain.toFixed(1),
    maintainAge:Math.round(s.age+maintainRemain), neglectAge:Math.round(s.age+neglectRemain),
    actions:A
  };
}

// ── モード（健康資産 / 健康寿命）状態・描画・配線 ──
let _lsMode='unselected';
function renderLifespan(s,improvedState){
  document.body.dataset.mode=_lsMode;
  const life=computeLifespan(s);
  const set=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v;};
  set('lifeLostBig', `−${life.loss}年`);
  const days=Math.round(life.loss*365);
  const topAction=life.actions[0]?.label||'今の生活習慣を続ける';
  const visionTitle=document.getElementById('lifeVisionTitle');
  const visionSub=document.getElementById('lifeVisionSub');
  if(visionTitle)visionTitle.textContent='生活習慣による試算の違いを確認します。';
  if(visionSub)visionSub.textContent='年数は独自の参考モデルによる値です。実際の健康状態や受診の判断は、健診の判定・医療機関の案内を確認してください。';
  set('lifeDays', life.loss>=1?days.toLocaleString():'0');
  window._lifeTarget=life.loss;
  set('lifeMaintainAge', life.maintainAge);
  set('lifeNeglectAge', life.neglectAge);
  // 健康年数バー（維持=100%基準、放置=残り年数比で短縮表示）
  const gp=Math.round(life.maintainRemain>0?Math.max(6,(life.neglectRemain/life.maintainRemain)*100):100);
  const lbG=document.getElementById('lbGood'), lbB=document.getElementById('lbBad');
  if(lbG)lbG.style.width='100%';
  if(lbB)lbB.style.width=gp+'%';
  set('lbGoodAge', life.maintainAge+'歳');
  set('lbBadAge', life.neglectAge+'歳');
  set('lbGap', `比較基準との年数差：約${life.loss}年（参考値）`);
  const la=document.getElementById('lifeActions');
  if(la){
    if(life.actions.length){
      la.innerHTML='<div class="la-h">改善条件ごとの参考年数差（効果の予測ではありません）</div>'
        + life.actions.map(a=>`<div class="la-row"><span class="la-l">${a.label}</span><span class="la-y">+${a.years}年</span></div>`).join('')
        + `<div class="la-row la-total"><span class="la-l">すべての改善条件を設定した場合</span><span class="la-y">最大 +約${life.loss}年</span></div>`;
    } else {
      la.innerHTML='<div class="la-h">現在の入力条件では、追加の変更項目はありません。</div>';
    }
  }
  // 改善トグルで選んだ条件を、健康寿命の主結果にも即時反映する
  const live=document.getElementById('lifeLiveChange');
  if(live){
    if(improvedState){
      const improvedLife=computeLifespan(improvedState);
      const gained=Math.max(0,improvedLife.neglectRemain-life.neglectRemain);
      live.hidden=false;
      set('lifeLiveValue',`+${gained.toFixed(1)}年`);
      set('lifeLiveSub','現在の条件と、選んだ改善条件との差です。個人にその年数の効果があることを保証するものではありません。');
    } else {
      live.hidden=true;
    }
  }
  const src=document.getElementById('lifeSrc');
  if(src){
    const band=Math.max(1,Math.round(life.loss*0.25));
    src.innerHTML='独自の参考計算。個人の予測精度や統計的な誤差範囲は検証されていません。<a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7190036/" target="_blank" rel="noopener">生活習慣と疾患のない余命の関連を扱う研究例：Li et al., BMJ 2020</a>。この研究が本ツールの計算全体を検証したものではありません。';
  }
  const teaser=document.getElementById('lifeTeaser');
  if(teaser){
    teaser.innerHTML='「健康資産を比べる」を選ぶと、80歳時点の資産差額も確認できます。';
  }
  const h=document.getElementById('simulationResults');
  if(h) h.textContent=(_lsMode==='lifespan'?'あなたの健康寿命シミュレーション結果':'あなたの健康資産シミュレーション結果');
}
function setMode(m){
  _lsMode=(m==='lifespan')?'lifespan':'asset';
  document.body.dataset.mode=_lsMode;
  const a=document.getElementById('modeAsset'), l=document.getElementById('modeLife');
  if(a)a.classList.toggle('on',_lsMode==='asset');
  if(l)l.classList.toggle('on',_lsMode==='lifespan');
  if(a)a.setAttribute('aria-pressed',String(_lsMode==='asset'));
  if(l)l.setAttribute('aria-pressed',String(_lsMode==='lifespan'));
  const modeFlow=document.getElementById('modeFlow');
  if(modeFlow)modeFlow.hidden=false;
  window.dispatchEvent(new Event('scroll'));
  const modeContext=document.getElementById('modeContext');
  if(modeContext)modeContext.innerHTML=_lsMode==='lifespan'
    ? '生活習慣 → 健診結果 → シミュレーションの順に進めます。'
    : '生活習慣・資産情報 → 健診結果 → シミュレーションの順に進めます。';
  const consentLead=document.getElementById('consentLead');
  const consentLocal=document.getElementById('consentLocal');
  if(_lsMode==='lifespan'){
    if(consentLead)consentLead.textContent='本シミュレーションは、入力いただいた健診データ・生活習慣をもとに、健康で自立して過ごせる期間への影響を試算するツールです。';
    if(consentLocal)consentLocal.innerHTML='入力した健診値・生活習慣は<strong>この端末内だけ</strong>で計算に使われます（生の数値は送信しません）';
  } else {
    if(consentLead)consentLead.textContent='本シミュレーションは、入力いただいた健診データ・資産情報をもとに、健康リスクと将来資産への影響を試算するツールです。';
    if(consentLocal)consentLocal.innerHTML='入力した健診値・資産情報は<strong>この端末内だけ</strong>で計算に使われます（生の数値は送信しません）';
  }
  const step1Title=document.getElementById('step1Title');
  if(step1Title)step1Title.textContent='テーマを選ぶ';
  const assetInfo=document.getElementById('assetInfoBox');
  if(assetInfo)assetInfo.setAttribute('aria-hidden',String(_lsMode==='lifespan'));
  const preRun=document.body.classList.contains('pre-run');
  const rb=document.getElementById('runBtn');
  if(rb)rb.textContent = preRun
    ? (_lsMode==='lifespan'?'健康年数を試算する':'80歳までの資産を試算する')
    : 'もう一度シミュレーションする';
  // 実行前プレースホルダをモード連動＝"これから出る答え"を予告
  const pmT=document.querySelector('#prerunMsg .pm-t'), pmS=document.querySelector('#prerunMsg .pm-s');
  if(pmT) pmT.textContent = _lsMode==='lifespan' ? '生活習慣の条件による健康年数の差' : '現在の条件と比較基準の、80歳時点の資産差額';
  if(pmS) pmS.textContent = '入力後に実行ボタンを押すと、ここに表示されます。';
  const pmNext=document.getElementById('pmNext');
  if(pmNext) pmNext.textContent = _lsMode==='lifespan'
    ? '試算後は、生活習慣による年数差を比較できます。'
    : '試算後は、運動などの条件を変えて比較できます。';
  try{ updateAll(); }catch(e){}
  // 実行済みならモード切替でもう一方の結果へ誘導＋山場を再演出
  if(!preRun){
    const _t=_lsMode==='lifespan'?document.getElementById('lifespanResult'):document.getElementById('age80box');
    if(_t) _t.scrollIntoView({behavior:'smooth',block:'center'});
    animateHero();
  }
}
function clearMode(){
  _lsMode='unselected';
  document.body.dataset.mode='unselected';
  const a=document.getElementById('modeAsset'), l=document.getElementById('modeLife');
  if(a){a.classList.remove('on');a.setAttribute('aria-pressed','false');}
  if(l){l.classList.remove('on');l.setAttribute('aria-pressed','false');}
  const modeFlow=document.getElementById('modeFlow');
  if(modeFlow)modeFlow.hidden=true;
  const step1Title=document.getElementById('step1Title');
  if(step1Title)step1Title.textContent='テーマを選ぶ';
  window.dispatchEvent(new Event('scroll'));
}
['modeAsset','modeLife'].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener('click',()=>setMode(el.dataset.mode));
});

// A4レポート（画像保存・PDF印刷 共通）をモード対応で描画
function renderReportA4(s,sim,life){
  const g=id=>document.getElementById(id);
  const set=(id,v)=>{const e=g(id); if(e)e.textContent=v;};
  const lg=g('raLogo');
  if(lg) lg.src=new URL('assets/images/bp-logo.png',document.baseURI).href;
  let ds='';
  try{ const d=new Date(); ds=`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`; }catch(e){}
  set('raDate', ds+' 試算');
  const order=[['glucose','糖代謝'],['bp','血圧'],['lipid','脂質'],['liver','肝機能'],['kidney','腎機能'],['musculo','筋骨格']];
  if(g('raRisks')) g('raRisks').innerHTML = order.map(function(o){
    const v=(s.risks&&s.risks[o[0]])||0, col=bc(v);
    return `<div class="rr"><span class="rr-n">${o[1]}</span><span class="rr-bar"><span class="rr-fill" style="width:${v}%;background:${col}"></span></span><span class="rr-v" style="color:${col}">${v}</span></div>`;
  }).join('');
  renderReportTrend(s);
  if(_lsMode==='lifespan'){
    set('raTitle','健康寿命シミュレーション結果');
    set('raHeroLabel','独自モデルによる健康年数の条件比較');
    set('raFmLL','健康維持の比較基準'); set('raFmLV', '0年');
    set('raFmRL','現在条件の参考差'); set('raFmRV', life.loss+'年'); set('raFmOp','−');
    set('raFmDL','条件による年数差'); set('raFmDV', life.loss+'年');
    set('raDetailT','改善条件を設定した場合の年数差（参考）');
    g('raDetail').innerHTML = life.actions.length
      ? life.actions.slice(0,4).map(a=>`<div class="li"><span>${a.label}</span><span class="y">+${a.years}年</span></div>`).join('')
        + `<div class="li tot"><span>すべての改善条件を設定した場合</span><span class="y">最大 +約${life.loss}年</span></div>`
      : '<div class="li"><span>現在の入力条件では、追加の変更項目はありません。</span></div>';
    g('raMsg').innerHTML='健診結果の判定と受診案内を確認してください。運動について医師の指示がある場合は、その指示に従ってください。';
    g('raFoot').textContent='独自の参考モデル。個人の寿命・発症年齢を予測する妥当性は検証されていません。年数差は仮定による計算で、個人への効果や誤差範囲を保証しません。研究例：Li et al., BMJ 2020 https://pmc.ncbi.nlm.nih.gov/articles/PMC7190036/';
  } else {
    set('raTitle','健康資産シミュレーション結果');
    set('raHeroLabel','現在の条件を続ける想定と、比較基準の資産差額');
    set('raFmLL','比較基準：追加負担なし'); set('raFmLV', fmt(sim.blue80));
    if(sim.red80 < 0){ set('raFmRL','現在の条件を続ける想定'); set('raFmRV', '−'+fmt(-sim.red80)); set('raFmOp','＋'); }
    else { set('raFmRL','現在の条件を続ける想定'); set('raFmRV', fmt(sim.red80)); set('raFmOp','−'); }
    set('raFmDL','80歳時点の資産差額（独自試算）'); set('raFmDV', fmt(sim.diff80));
    set('raDetailT','80歳までの試算差額の内訳');
    const tot=Math.max(0,sim.diff80);
    g('raDetail').innerHTML=
      `<div class="li"><span>設定した仮定による累積収入減</span><span class="y">-${fmt(sim.cumulativePT)}</span></div>`
     +`<div class="li"><span>設定した負担割合による累積医療費</span><span class="y">-${fmt(sim.cumulativeMed)}</span></div>`
     +`<div class="li"><span>運用益の差（年率3%の仮定）</span><span class="y">-${fmt(sim.compoundLoss)}</span></div>`
     +`<div class="li tot"><span>80歳時点の資産差額（試算）</span><span class="y">-${fmt(tot)}</span></div>`
     +`<div class="ra-detail-note">※上部は資産推移（複利込み）で比較した80歳時点の資産差額です。項目ごとに算定範囲が異なります。単純合計はできません。</div>`;
    g('raMsg').innerHTML='健診結果の判定と受診案内を確認してください。運動条件を変えた場合の試算は、画面のSTEP 3で確認できます。';
    g('raFoot').textContent=`独自の参考モデル。本人負担の仮定${n('medicalShare')??30}%、収入減の仮定${n('incomeLossAssumption')||0}%、年率3%。高額療養費・付加給付・通院交通費・時間価値・運動費用は自動反映しません。個人の将来資産や疾病を予測するものではありません。`;
  }
  renderReportInputs();
  renderReportSteps(s);
  if(window.BPResearch) BPResearch.annotateReport();
}

// PDF/画像レポートに「入力データ（基本情報・健診結果＋基準範囲）」を出力（入力された項目のみ）
function renderReportInputs(){
  const grid=document.getElementById('raInputGrid');
  if(!grid) return;
  const val=id=>{const e=document.getElementById(id); return e?String(e.value||'').trim():'';};
  const num=id=>{const v=val(id); return v===''?null:parseFloat(v);};
  const selTxt=id=>{const e=document.getElementById(id); return (e&&e.selectedIndex>=0&&e.options[e.selectedIndex])?e.options[e.selectedIndex].text:'';};
  const gv=id=>{const e=document.getElementById(id); return e?e.value:'';};
  const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const chip=o=>`<span class="ra-ichip${o.warn?' warn':''}"><span class="k">${esc(o.k)}</span><span class="v">${esc(o.v)}</span>${o.u?`<span class="u">${esc(o.u)}</span>`:''}${o.ref?`<span class="ref">${esc(o.ref)}</span>`:''}</span>`;
  // 基本情報
  const basic=[];
  const bpush=(k,v,warn)=>{ if(v) basic.push({k,v,warn:!!warn}); };
  bpush('性別', selTxt('gender'));
  bpush('年齢', val('age')?val('age')+'歳':'');
  bpush('身長', val('height')?val('height')+'cm':'');
  bpush('体重', val('weight')?val('weight')+'kg':'');
  const _wa=num('waist'), _g=gv('gender');
  if(val('waist')) bpush('腹囲', val('waist')+'cm', (_g==='male'&&_wa>=85)||(_g==='female'&&_wa>=90));
  const _h=num('height'), _w=num('weight');
  if(_h>0&&_w>0){ const bmi=_w/Math.pow(_h/100,2); bpush('BMI', bmi.toFixed(1), bmi>=25); }
  bpush('運動習慣', selTxt('habit'));
  { let sm=selTxt('smoking'); const smv=gv('smoking');
    if(smv==='current'){ const c=val('cigCount'); sm=sm+(c?'（'+c+'本/日）':''); }
    bpush('喫煙', sm, smv==='current'); }
  bpush('年収', val('income')?val('income')+'万円':'');
  bpush('総資産', val('assets')?val('assets')+'万円':'');
  // 健診値（基準範囲つき・入力があるものだけ）
  const labs=[];
  { const sbp=num('sbp'), dbp=num('dbp');
    if(val('sbp')||val('dbp')) labs.push({k:'血圧', v:(val('sbp')||'—')+'/'+(val('dbp')||'—'), u:'mmHg', ref:'基準 <130/85', warn:(sbp!==null&&sbp>=130)||(dbp!==null&&dbp>=85)}); }
  const L=(k,id,u,lo,hi,ref)=>{ const x=num(id); if(x!==null) labs.push({k,v:val(id),u,ref,warn:(lo!==null&&x<lo)||(hi!==null&&x>hi)}); };
  L('LDL','ldl','mg/dL',null,139,'基準 <120');
  L('HDL','hdl','mg/dL',40,null,'基準 ≥40');
  L('中性脂肪','tg','mg/dL',null,149,'基準 <150');
  L('空腹時血糖','glucose','mg/dL',null,99,'基準 <100');
  L('HbA1c','hba1c','%',null,5.5,'基準 <5.6');
  L('AST','ast','U/L',null,30,'基準 ≤30');
  L('ALT','alt','U/L',null,30,'基準 ≤30');
  L('γ-GTP','ggt','U/L',null,50,'基準 ≤50');
  let html='<div class="ra-igroup"><span class="ra-igl">基本情報</span>'+basic.map(chip).join('')+'</div>';
  html+='<div class="ra-igroup"><span class="ra-igl">健診値</span>'+(labs.length?labs.map(chip).join(''):'<span class="ra-inone">未入力（基本情報のみで試算）</span>')+'</div>';
  grid.innerHTML=html;
}

// PDF：「現状の数値が続いた場合の見込み」（computeTrend を再利用）
function renderReportTrend(s){
  const box=document.getElementById('raTrend');
  if(!box) return;
  let trend; try{ trend=computeTrend(s); }catch(e){ trend={rows:[]}; }
  const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const rows=(trend&&trend.rows)||[];
  box.innerHTML = rows.length
    ? rows.map(r=>`<div class="ra-tr ${r.ok?'ok':''}"><span class="tl">${esc(r.label)}</span><span class="tv">${esc(r.val)}</span></div>`).join('')
    : '<div class="ra-tr ok"><span class="tv">主要なリスクシグナルは検出されませんでした。この状態の維持を。</span></div>';
}

// PDF：「この結果から、次にすべきこと」（入力から具体的な行動を生成）
function renderReportSteps(s){
  const ol=document.getElementById('raSteps');
  if(!ol) return;
  let flags=[]; try{ flags=computeAlertFlags(s)||[]; }catch(e){}
  const steps=[];
  if(flags.length) steps.push(`基準を外れた項目（${flags.length}つ）を<b>二次健診で精密検査</b>し、医師に相談する`);
  else steps.push(`気になる数値は<b>二次健診で正確に確認</b>する（健診結果の判定と受診案内に従ってください）`);
  if(s.exerciseHours>=2.5) steps.push(`今の<b>運動習慣を継続</b>する（体調や医師の指示に合わせて調整）`);
  else steps.push(`<b>運動習慣を身につける</b>（まずは週2〜3回・1回30分から。体調や医師の指示に合わせて調整）`);
  if(s.smoking==='current') steps.push(`<b>禁煙</b>に取り組む（相談先や支援制度を確認）`);
  if(s.bmi!==null&&s.bmi>=25) steps.push(`<b>体重について相談</b>する（減量の必要性や方法を医師・管理栄養士に確認）`);
  ol.innerHTML = steps.slice(0,4).map(t=>`<li>${t}</li>`).join('');
}

// 改善（禁煙・運動習慣・減量）を反映した場合の資産推移。altStateはcomputeRisk(overrides)の結果
function projectImproved(altState){
  const userIncome=n('income');
  const userAssets=n('assets')||0;
  const altP=projectAsset(altState,altState.gender,altState.age,userIncome,userAssets,false);
  return{arr:altP.arr,val80:altP.arr[altP.arr.length-1]};
}

// 運動投資の合理性（ROI）：習慣化投資 vs 守れる生涯資産
// targetHoursの運動習慣を身につけた場合、現状放置(sim.red80)と比べて80歳時点で守れる資産（万円）
function protectedAssetsMan(s, sim, targetHours){
  const eff = Math.max(s.exerciseHours, targetHours);
  const altState = computeRisk({exerciseHoursPerWeek: eff});
  const altP = projectAsset(altState, altState.gender, altState.age, n('income'), n('assets')||0, false);
  return altP.arr[altP.arr.length-1] - sim.red80; // 万円
}
function renderExerciseROI(s,sim){
 const box=document.getElementById('roiBlock');if(!box)return;
 const v=computeExerciseValue(s,sim);
 box.querySelector('.roi-step-tag').textContent='運動の条件による比較';
 box.querySelector('.roi-title').textContent='30分×週3回の運動を続けた場合';
 box.querySelector('.roi-lead').textContent=v?'現在の運動習慣を続ける場合と、80歳時点の資産を比べています。':'この入力条件では、週90分の運動を加えた場合の資産差額はありません。';
 const session=box.querySelector('.roi-per-session');if(session)session.hidden=!v;
 const amount=document.getElementById('roiSessionValue');if(amount)amount.textContent=v?fmtYen(v.perSessionYen):'—';
 document.getElementById('roiProtect').textContent=v?fmt(v.diff):'追加の差額なし';
 box.querySelector('.rh-label').textContent='80歳まで続けた場合の資産差額';
 document.getElementById('roiProtectSub').textContent=v?`${v.yearsLeft}年間 × 年52週 × 週3回 = ${v.totalSessions.toLocaleString('ja-JP')}回で換算`:'運動量をすでに満たしている場合も、追加の差額は表示しません。';
 box.querySelector('.roi-note').textContent='※1回の運動でこの金額が増えるという意味ではありません。長期の試算差額を運動回数で割った値です。運動費用は含みません。治療中・痛みのある方は、主治医等の指示に従ってください。';
 box.style.display='';
}

// ═══════════════════════════════════════════════════
// 9. 生涯医療費テーブル
// ═══════════════════════════════════════════════════
// 厚労省2010年推計を2022年国民医療費水準（×1.25）で補正
const LIFETIME_BASE={male:2300*1.25, female:2500*1.25}; // 万円

function lifetimeMedTable(gender,medScore){
  const base=LIFETIME_BASE[gender];
  const mult=medScore<40?narrowRamp(medScore,40,8,1.0,1.3)
    :medScore<70?1.3+(1.7-1.3)*((medScore-40)/30)
    :1.7;
  const riskBase=base*mult;

  // 年齢別配分（厚労省データ準拠）
  // 〜65歳:51%, 65-80歳:30%, 80歳〜:19% （70歳未満51%→65歳未満として近似）
  const phases=[
    {label:'〜65歳',ratio:0.51},
    {label:'65〜80歳',ratio:0.30},
    {label:'80歳以降',ratio:0.19},
  ];

  return phases.map(p=>({
    label:p.label,
    healthy:Math.round(base*p.ratio),
    risk:Math.round(riskBase*p.ratio)
  }));
}

// ═══════════════════════════════════════════════════
// 10. Canvas グラフ描画（HiDPI対応）
// ═══════════════════════════════════════════════════
function chartDomain(values){
 const low=Math.min(...values),high=Math.max(...values),span=Math.max(high-low,1);
 return {min:low-span*0.08,max:high+span*0.08};
}
function drawChart(ages,blueArr,redArr,startAge,greenArr){
  const cv=document.getElementById('chart');
  const wrap=cv.parentElement;
  const dW=Math.max(200,wrap.clientWidth-24);
  const dH=Math.round(dW*(window._chartRatio||0.34));
  const dpr=window.devicePixelRatio||1;
  cv.width=dW*dpr; cv.height=dH*dpr;
  cv.style.width=dW+'px'; cv.style.height=dH+'px';
  const ctx=cv.getContext('2d');
  ctx.scale(dpr,dpr);
  const W=dW,H=dH;
  ctx.clearRect(0,0,W,H);
  // チャート内テキストはUIと同じフォント・固定サイズ（画面幅で肥大化・重なりさせない）
  const CF='"Noto Sans JP","Hiragino Sans",Meiryo,sans-serif';
  const _cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

  const pad={l:52,r:14,t:12,b:28};
  const all=[...blueArr,...redArr,...(greenArr||[])];
  const domain=chartDomain(all);
  const minV=domain.min,maxV=domain.max;
  const n=ages.length;
  const xFn=i=>pad.l+(W-pad.l-pad.r)*(i/(n-1));
  const yFn=v=>H-pad.b-(H-pad.t-pad.b)*((v-minV)/(maxV-minV));

  // Grid
  ctx.strokeStyle='#e4ecef';ctx.lineWidth=1;
  const steps=4;
  for(let i=0;i<=steps;i++){
    const y=pad.t+(H-pad.t-pad.b)*(i/steps);
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    const val=minV+(maxV-minV)*(1-i/steps);
    ctx.fillStyle='#7a8284';
    ctx.font=`${_cl(Math.round(W/70),11,13)}px ${CF}`;
    ctx.fillText((val>=10000?Math.round(val/10000)+'億':Math.round(val/100)*100+'万'),2,y+4);
  }

  // 60歳マーカー（定年・再雇用開始）
  const idx60=ages.indexOf(60);
  if(idx60>=0){
    const x60=xFn(idx60);
    ctx.strokeStyle='#aabbcc';ctx.lineWidth=1;ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.moveTo(x60,pad.t);ctx.lineTo(x60,H-pad.b);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#7a8284';
    ctx.font=`${_cl(Math.round(W/80),10,12)}px ${CF}`;
    ctx.fillText('60歳',x60+2,pad.t+22);
  }

  // 65歳マーカー（年金移行）
  const idx65=ages.indexOf(65);
  if(idx65>=0){
    const x65=xFn(idx65);
    ctx.strokeStyle='#0fa8a3';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);
    ctx.beginPath();ctx.moveTo(x65,pad.t);ctx.lineTo(x65,H-pad.b);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#0fa8a3';
    ctx.font=`bold ${_cl(Math.round(W/80),10,12)}px ${CF}`;
    ctx.fillText('65歳',x65+3,pad.t+12);
  }

  // Fill area
  ctx.beginPath();
  blueArr.forEach((v,i)=>{const x=xFn(i),y=yFn(v);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
  redArr.slice().reverse().forEach((v,i)=>{
    const idx=n-1-i;ctx.lineTo(xFn(idx),yFn(v));
  });
  ctx.closePath();
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'rgba(89,105,107,.14)');
  grad.addColorStop(1,'rgba(89,105,107,.03)');
  ctx.fillStyle=grad;ctx.fill();

  // Lines
  function drawLine(arr,color,dash){
    ctx.strokeStyle=color;ctx.lineWidth=2.5;
    if(dash)ctx.setLineDash(dash);else ctx.setLineDash([]);
    ctx.beginPath();
    arr.forEach((v,i)=>{const x=xFn(i),y=yFn(v);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
    ctx.stroke();ctx.setLineDash([]);
    arr.forEach((v,i)=>{
      if(i%5===0||i===0||i===n-1){
        ctx.fillStyle=color;ctx.beginPath();
        ctx.arc(xFn(i),yFn(v),3.5,0,Math.PI*2);ctx.fill();
      }
    });
  }
  drawLine(redArr,'#d46f8e');
  if(greenArr)drawLine(greenArr,'#0a807c',[5,3]);
  drawLine(blueArr,'#638fa7');

  // X axis labels
  ctx.fillStyle='#60738f';
  const fs=_cl(Math.round(W/60),11,13);
  ctx.font=`${fs}px ${CF}`;
  ages.forEach((a,i)=>{
    if(a===startAge||a%10===0||a===80){
      ctx.fillText(`${a}歳`,xFn(i)-(a>=10?10:6),H-4);
    }
  });

  // Exact comparison values are shown below the chart; keep plot lines unobstructed.

}

// ═══════════════════════════════════════════════════
// 11. メイン更新関数
// ═══════════════════════════════════════════════════
function fmt(v){
  if(v>=10000) return (v/10000).toFixed(1)+'億円';
  return v.toLocaleString()+'万円';
}
function lv(s){return s>=70?'高':s>=40?'中':'低';}
function bc(s){return s>=70?'#e24c5e':s>=40?'#f0925a':'#0fa8a3';}
function fmtYen(v){return v>=10000?`約${(Math.round(v/1000)/10).toFixed(1)}万円`:`約${Math.round(v).toLocaleString()}円`;}

// 「運動習慣を30分×週3回にする」場合のみを取り出し、30分の運動1回あたりの資産防衛額を試算
function computeExerciseValue(s,sim){
  if(s.exerciseHours>=1.5)return null;
  const altState=computeRisk({exerciseHoursPerWeek:1.5});
  const userIncome=n('income');
  const userAssets=n('assets')||0;
  const altP=projectAsset(altState,altState.gender,altState.age,userIncome,userAssets,false);
  const val80=altP.arr[altP.arr.length-1];
  const diff=val80-sim.red80;
  if(diff<=0)return null;
  const yearsLeft=80-s.age;
  const totalSessions=Math.max(1,Math.round(yearsLeft*52*3)); // 週3回×52週で試算
  const perSessionYen=(diff*10000)/totalSessions;
  return{diff,totalSessions,yearsLeft,perSessionYen};
}

const RISK_LABELS=[
  ['糖代謝リスク','glucose'],['血圧・脳心血管リスク','bp'],['脂質・動脈硬化リスク','lipid'],
  ['肝機能リスク','liver'],['腎機能リスク','kidney'],['筋骨格・慢性不調リスク','musculo']
];

// 特定健診の基準値超え項目をカウント（2項目以上で要注意アラート表示）
function computeAlertFlags(s){
  const flags=[];
  if(s.bmi!==null&&s.bmi>=25) flags.push('BMI（過体重・肥満）');
  const waistOver=s.waist!==null&&((s.gender==='male'&&s.waist>=85)||(s.gender==='female'&&s.waist>=90));
  if(waistOver) flags.push('腹囲（内臓脂肪型肥満の疑い）');
  if(s.sbp!==null&&s.sbp>=130) flags.push('血圧（収縮期130mmHg以上）');
  if((s.glucose!==null&&s.glucose>=100)||(s.hba1c!==null&&s.hba1c>=5.6)) flags.push('血糖値（空腹時100以上またはHbA1c 5.6%以上）');
  if(s.ldl!==null&&s.ldl>=120) flags.push('LDLコレステロール（120mg/dL以上）');
  return flags;
}

// 結果を「いつか改善する」ではなく、明日できる一つの行動に落とし込む。
// 結果を「数字」だけで終わらせないための出口。医療診断ではなく、入力に応じて最初の行動を示す。
function renderNextPlan(s,alertFlags){
 document.getElementById('nextPlanTitle').textContent='社内の施策・受診案内を見る';
 document.getElementById('nextPlanSub').textContent='社内の健康施策と、健診後の受診案内をご紹介します。';
}

// 結果を「読む」だけで終わらせず、最も効果が見込める変化を一押しで試せるようにする
function renderImproveTry(s,{alreadyNonSmoker,alreadyActive,canSimulateWeight,hasImprovement,isLifeMode}){
  const box=document.getElementById('improveBox');
  const tryBox=document.getElementById('improveTry');
  const title=document.getElementById('improveTryTitle');
  const desc=document.getElementById('improveTryDesc');
  const button=document.getElementById('tryImproveBtn');
  if(!box||!tryBox||!title||!desc||!button)return;

  box.classList.toggle('has-improvement',hasImprovement);
  let action='';
  if(!alreadyNonSmoker){
    action='quit';
    title.textContent='禁煙を続ける場合を試算する';
    desc.textContent=isLifeMode
      ? '禁煙を続ける条件で、現在との年数差を表示します。'
      : '禁煙を続ける条件で、80歳時点の資産差額を表示します。';
  } else if(!alreadyActive){
    action='exercise';
    title.textContent='30分×週3回の運動を続ける場合を試算する';
    desc.textContent=isLifeMode
      ? '運動を週90分続ける条件で、現在との年数差を表示します。'
      : '運動を週90分続ける条件で、80歳時点の資産差額を表示します。';
  } else if(canSimulateWeight && s.bmi>=25){
    action='weight';
    title.textContent='体重を3kg減らした条件で試算する';
    desc.textContent=isLifeMode
      ? '体重を3kg減らした条件で、現在との年数差を表示します。'
      : '体重を3kg減らした条件で、80歳時点の資産差額を表示します。';
  }

  tryBox.style.display=action?'':'none';
  if(!action)return;
  button.dataset.improveAction=action;
  button.disabled=hasImprovement;
  button.textContent=hasImprovement?'選んだ条件を反映しています':'この条件で比べる →';
}

let simulationUpdateFrame=0;
function queueSimulationUpdate(){
 if(simulationUpdateFrame)return;
 simulationUpdateFrame=requestAnimationFrame(()=>{simulationUpdateFrame=0;updateAll();});
}
function updateAll(){
 if(simulationUpdateFrame){cancelAnimationFrame(simulationUpdateFrame);simulationUpdateFrame=0;}
 const validationIds=[...Object.keys(RULES),'income','assets','medicalShare','incomeLossAssumption'];
 const invalidInputs=validationIds.map(id=>document.getElementById(id)).filter(el=>el&&!el.checkValidity());
 const inputWarning=document.getElementById('simulationInputError');
 if(inputWarning){inputWarning.hidden=invalidInputs.length===0;inputWarning.textContent=invalidInputs.length?'入力範囲・数値・単位を確認してください。修正が終わるまで、結果は再計算されません。':'';}
 if(invalidInputs.length)return;
  if(!validateAll())return;
  const s=computeRisk();
  const trend=computeTrend(s);
  const sim=simulate(s);
  renderLifespan(s);
  renderReportA4(s,sim,computeLifespan(s));

  // 健診基準値アラート（2項目以上で表示）
  const alertFlags=computeAlertFlags(s);
  const alertBox=document.getElementById('checkupAlert');
  if(alertFlags.length>=2){
    document.getElementById('caTitle').textContent=`注意：健診基準値を超える項目が${alertFlags.length}つあります`;
    document.getElementById('caDetail').textContent=alertFlags.join('　・　');
    alertBox.style.display='flex';
  } else {
    alertBox.style.display='none';
  }
  renderNextPlan(s,alertFlags);
  // Anonymous snapshots are recorded only after an explicit simulation run.

  // 改善（禁煙・運動習慣・減量）トグルの表示制御 ── リスクバーより先に判定する
  const quitEl=document.getElementById('impQuitSmoke');
  const exEl=document.getElementById('impExercise');
  const wlEl=document.getElementById('impWeightLoss');
  const quitWrap=document.getElementById('impQuitSmokeWrap');
  const exWrap=document.getElementById('impExerciseWrap');
  const weightRow=document.getElementById('impWeightRow');
  const quitNote=document.getElementById('impQuitSmokeNote');
  const exNote=document.getElementById('impExerciseNote');
  const weightNote=document.getElementById('impWeightNote');

  const alreadyNonSmoker=s.smoking!=='current';
  quitWrap.classList.toggle('done',alreadyNonSmoker);
  quitEl.disabled=alreadyNonSmoker;
  if(alreadyNonSmoker){quitEl.checked=false;quitNote.textContent=s.smoking==='past'?'すでに禁煙済みです':'すでに非喫煙です';}
  else{quitNote.textContent='';}

  const alreadyActive=s.exerciseHours>=1.5;
  exWrap.classList.toggle('done',alreadyActive);
  exEl.disabled=alreadyActive;
  if(alreadyActive){exEl.checked=false;exNote.textContent='設定した運動量をすでに満たしています';}
  else{exNote.textContent='';}

  const canSimulateWeight=s.bmi!==null;
  weightRow.classList.toggle('done',!canSimulateWeight);
  wlEl.disabled=!canSimulateWeight;
  document.getElementById('impWeightVal').textContent=(Number(wlEl.value)>0?`-${wlEl.value}kg`:'0kg');
  if(!canSimulateWeight){
    wlEl.value=0;
    document.getElementById('impWeightVal').textContent='0kg';
    weightNote.textContent='減量した条件で比べるには、身長と体重を入力してください。';
  } else {
    weightNote.textContent=`現在の体重${n('weight')}kg → ${(n('weight')-Number(wlEl.value))}kg（目安の試算値。腹囲の変化は考慮していません）`;
  }

  document.getElementById('improveBox').style.display=''; // Keep STEP 3 visible even when all available changes are already satisfied.

  const overrides={};
  if(quitEl.checked&&!alreadyNonSmoker)overrides.smoking='never';
  if(exEl.checked&&!alreadyActive)overrides.exerciseHoursPerWeek=1.5;
  if(canSimulateWeight&&Number(wlEl.value)>0)overrides.weightLossKg=Number(wlEl.value);
  const hasImprovement=Object.keys(overrides).length>0;
  const altState=hasImprovement?computeRisk(overrides):null;
  // 選んだ出口に応じ、改善結果の見出しと主指標を切り替える
  const isLifeMode=_lsMode==='lifespan';
  const improveTitle=document.getElementById('improveTitle');
  const improveSub=document.getElementById('improveSub');
  if(improveTitle)improveTitle.textContent=isLifeMode
    ? '生活習慣の条件を変えると、健康年数の試算は？'
    : '生活習慣の条件を変えると、80歳時点の資産は？';
  if(improveSub)improveSub.textContent=isLifeMode
    ? '禁煙・運動・減量から条件を選び、健康年数の差を確認します。'
    : '禁煙・運動・減量から条件を選び、80歳時点の資産差額を確認します。';
  renderImproveTry(s,{alreadyNonSmoker,alreadyActive,canSimulateWeight,hasImprovement,isLifeMode});
  // 健康寿命モードでは、改善後の年数をメイン結果にも同時表示する
  renderLifespan(s,altState);

  // Risk bars（改善後の疾患リスクスコアも並記）
  const rEl=document.getElementById('riskRows');rEl.innerHTML='';
  RISK_LABELS.forEach(([lb,k])=>{
    const sc=s.risks[k];
    const d=document.createElement('div');d.className='risk-row';
    let extra='';
    if(altState){
      const asc=altState.risks[k];
      extra = asc<sc
        ? `<div class="risk-improved">→ 改善後：${lv(asc)}（${asc}） 　${sc-asc}ポイント低下</div>`
        : `<div class="risk-improved same">→ 改善後も変化なし</div>`;
    }
    d.innerHTML=`<div class="risk-row-main">
      <div class="risk-name">${lb}</div><span class="risk-score">参考スコア ${sc}/100</span>
      <div class="bar"><span style="width:${sc}%;background:${bc(sc)}"></span></div>
      <div class="risk-lv" style="background:${bc(sc)}">${lv(sc)}</div>
      </div>${extra}`;
    rEl.appendChild(d);
  });
  document.getElementById('precText').textContent=s.precision;
  document.getElementById('precDetail').textContent=`入力 ${s.entered}/${Object.keys(RULES).length}項目 ｜ 入力区分：${s.precision}`;

  // Trend rows
  const trEl=document.getElementById('trendRows');trEl.innerHTML='';
  trend.rows.forEach(r=>{
    const d=document.createElement('div');d.className='trend-row';
    d.innerHTML=`<div class="tlab">${r.label}</div><div class="tval${r.ok?' ok':''}">${r.val}</div>`;
    trEl.appendChild(d);
  });
  document.getElementById('trendSrc').textContent=trend.srcs.join('　／　');

  // Age 80 callout（差額を主役に簡略表示）
  document.getElementById('a80good').textContent=fmt(sim.blue80);
  { const _bad=document.getElementById('a80bad'), _op=document.getElementById('a80op'), _lbl=document.getElementById('a80badLabel');
    if(sim.red80 < 0){ if(_bad)_bad.textContent=fmt(-sim.red80); if(_op)_op.textContent='＋'; if(_lbl)_lbl.textContent='現在の条件の場合（マイナス）'; }
    else { if(_bad)_bad.textContent=fmt(sim.red80); if(_op)_op.textContent='−'; if(_lbl)_lbl.textContent='現在の条件の場合'; } }
  const _a80dc=document.getElementById('a80diffCalc');
  if(_a80dc) _a80dc.textContent=fmt(Math.max(0,Math.round(sim.diff80)));
  const a80big=document.getElementById('a80diffBig');
  const a80label=document.getElementById('a80mainLabel');
  const a80sub=document.getElementById('a80mainSub');
  if(sim.diff80>=10){
    a80big.classList.remove('good');
    a80label.textContent='追加負担なしの比較基準に対する、80歳時点の資産差額';
    a80big.textContent=`−${fmt(sim.diff80)}`;
    a80sub.textContent='現在の条件と比較基準との差です。実際の資産残高ではありません。';
    window._a80target=sim.diff80;
  } else {
    a80big.classList.add('good');
    a80label.textContent='入力した条件での、80歳時点の資産差額';
    a80big.textContent='ほぼ差額なし';
    a80sub.textContent='このモデルで差が小さくても、健康上の問題がないとは限りません';
    window._a80target=0;
  }

  let greenArr=null;
  const improveResult=document.getElementById('improveResult');
  const legendImproved=document.getElementById('legendImproved');
  if(hasImprovement){
    const imp=projectImproved(altState);
    greenArr=imp.arr;
    document.getElementById('impRiskScore').textContent=`${s.medScore} → ${altState.medScore}`;
    if(isLifeMode){
      const before=computeLifespan(s);
      const after=computeLifespan(altState);
      const gained=Math.max(0,after.neglectRemain-before.neglectRemain);
      document.getElementById('impRiskLabel').textContent='総合疾患リスクスコア';
      document.getElementById('impOutcomeLabel').textContent='条件変更後と比較基準の年数差';
      document.getElementById('impDiffLabel').textContent='現在の条件からの年数差（独自試算）';
      document.getElementById('impGood').textContent=`${after.loss.toFixed(1)}年（独自試算）`;
      document.getElementById('impDiff').textContent=`+${gained.toFixed(1)}年`;
    } else {
      document.getElementById('impRiskLabel').textContent='総合疾患リスクスコア';
      document.getElementById('impOutcomeLabel').textContent='改善した場合の80歳資産';
      document.getElementById('impDiffLabel').textContent='現在の条件を続ける場合との差額（独自試算）';
      document.getElementById('impGood').textContent=fmt(imp.val80);
      const impDiffVal=imp.val80-sim.red80;
      document.getElementById('impDiff').textContent=
        (impDiffVal>=0?'+':'-')+fmt(Math.abs(impDiffVal));
    }
    improveResult.style.display='';
    legendImproved.style.display='';
  } else {
    improveResult.style.display='none';
    legendImproved.style.display='none';
  }

  // 運動投資の合理性（ROI）
  renderExerciseROI(s,sim);

  // Chart
  drawChart(sim.ages,sim.blueArr,sim.redArr,s.age,greenArr);

  if(typeof renderExperience==='function')renderExperience(s,sim,altState,overrides);

  // Loss summary
  document.getElementById('lossPT').textContent=`-${fmt(sim.cumulativePT)}`;
  document.getElementById('lossMed').textContent=`-${fmt(sim.cumulativeMed)}`;
  document.getElementById('lossComp').textContent=`-${fmt(sim.compoundLoss)}`;
  const total=Math.max(0,sim.diff80);
  document.getElementById('lossTotal').textContent=`-${fmt(total)}`;

  // 結果まとめカード（結論を大きな1行に集約して出現）
  document.getElementById('scRiskBadge').textContent=`${s.medScore} （${lv(s.medScore)}）`;
  document.getElementById('scDate').textContent=new Date().toLocaleDateString('ja-JP');
  const scPre=document.getElementById('scHlPre');
  const scNum=document.getElementById('scHlNum');
  const scSub=document.getElementById('scHlSub');
  const exVal=computeExerciseValue(s,sim);
  if(sim.diff80>=10){
    scPre.textContent='現在の条件と比較基準の、80歳時点の差額';
    scNum.className='sc-hl-num bad';
    scNum.textContent=`−${fmt(sim.diff80)}`;
    let sub=`健康維持なら <b class="good">${fmt(sim.blue80)}</b>`;
    if(exVal) sub+=` ／ 30分の運動 1回で <b class="teal">${fmtYen(exVal.perSessionYen)}</b> を守れる計算です`;
    else if(s.exerciseHours>=1.5) sub+=` ／ すでに30分×週3回の運動習慣が将来の資産を守っています`;
    else sub+=` ／ 運動条件を変えた試算も確認できます`;
    scSub.innerHTML=sub;
  } else {
    scPre.textContent='今の状態なら、80歳の資産への影響は';
    scNum.className='sc-hl-num good';
    scNum.textContent='ほとんど差なし';
    scSub.innerHTML='このモデルで差が小さくても、健康上の問題がないとは限りません。生活習慣による違いは、条件を変えて確認してください。';
  }

}

// ═══════════════════════════════════════════════════
// 12. イベント・タブ・リサイズ
// ═══════════════════════════════════════════════════
const panels=[document.getElementById('p0'),document.getElementById('p1')];

// ── 5ステップ・ナビ：クリックでジャンプ＋スクロール連動で現在地をハイライト ──
(function(){
  const navItems=Array.from(document.querySelectorAll('.step-nav-item'));
  function setActive(step){
    navItems.forEach(a=>{const active=a.dataset.step===String(step);a.classList.toggle('on',active);if(active)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
  }
  function syncAvailableSteps(){
    const isPreRun=document.body.classList.contains('pre-run');
    const modeUnset=_lsMode==='unselected';
    navItems.forEach(a=>{
      const locked=false; // Every step heading can be opened explicitly.
      a.setAttribute('aria-disabled',String(locked));
      if(locked) a.setAttribute('tabindex','-1');
      else a.removeAttribute('tabindex');
    });
  }
  // スクロール位置に応じて現在のステップを判定
  function onScroll(){
    syncAvailableSteps();
    const y=window.scrollY + 110;
    let cur=1;
    navItems.forEach(a=>{const el=document.querySelector(a.getAttribute('href'));if(el&&el.getClientRects().length>0&&el.getBoundingClientRect().top+window.scrollY<=y)cur=Number(a.dataset.step);});
    setActive(cur);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('hashchange',()=>{syncAvailableSteps();const item=navItems.find(a=>a.getAttribute('href')===location.hash);if(item&&item.getAttribute('aria-disabled')!=='true')setActive(item.dataset.step);else onScroll();});
  onScroll();
})();

// ── MetS自動判定バナー ──
function updateMetsBanner(){
  const gender=document.getElementById('gender').value;
  const waist=n('waist'),sbp=n('sbp');
  const glucose=n('glucose'),hba1c=n('hba1c');
  const banner=document.getElementById('metsBanner');
  if(!banner)return;

  const waistOver=waist&&((gender==='male'&&waist>=85)||(gender==='female'&&waist>=90));
  if(!waistOver){banner.style.display='none';return;}

  const items=[];
  if(sbp&&sbp>=130)items.push('血圧↑');
  if((glucose&&glucose>=110)||(hba1c&&hba1c>=6.0))items.push('血糖↑');

  const title=document.getElementById('metsBannerTitle');
  const desc=document.getElementById('metsBannerDesc');
  if(items.length>=2){
    banner.className='mets-banner mets-red';
    title.textContent='メタボリックシンドローム該当（推定）';
    desc.textContent=`腹囲基準＋${items.join('・')} — 特定保健指導「積極的支援」対象になる可能性があります。`;
  } else if(items.length===1){
    banner.className='mets-banner';
    title.textContent='メタボリックシンドローム予備群';
    desc.textContent=`腹囲基準＋${items.join('・')} — 特定保健指導「動機付け支援」対象になる可能性があります。`;
  } else {
    banner.style.display='none';return;
  }
  banner.style.display='flex';
}
['waist','sbp','glucose','hba1c'].forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener('input',updateMetsBanner);
});
document.getElementById('gender').addEventListener('change',updateMetsBanner);

// 「現在喫煙中」を選んだ時だけ本数入力を表示する
function updateCigCountVisibility(){
  const show=document.getElementById('smoking').value==='current';
  document.getElementById('cigCountField').style.display=show?'':'none';
}
document.getElementById('smoking').addEventListener('change',()=>{
  updateCigCountVisibility();
  updateAll(); // 喫煙区分を変えたら即座に結果へ反映
});
// 本数を変えるたびリアルタイムで結果を更新（体重スライダーと同じ「触って試せる」挙動）
document.getElementById('cigCount').addEventListener('input',()=>{
  fwTrack('cig_count_change',{cigs:document.getElementById('cigCount').value});
  queueSimulationUpdate();
});
updateCigCountVisibility();

function resetPanels(){
  // 5ステップ・1カラム化により全パネル常時表示（タブ切替は廃止）
  panels.forEach(p=>p.classList.add('active-panel'));
}

window.addEventListener('resize',()=>{
  resetPanels();
  queueSimulationUpdate();
});

// 印刷時：グラフを縦長比率で再描画してA4横のスペースを活用
function redrawChart(){
  try{updateAll();}catch(e){}
}
window.addEventListener('beforeprint',()=>{
  window._chartRatio=0.42;redrawChart();
  const pd=document.getElementById('printDate');
  if(pd)pd.textContent=new Date().toLocaleDateString('ja-JP');
});
window.addEventListener('afterprint',()=>{window._chartRatio=null;redrawChart();});

// ═══════════════════════════════════════════════════
// 13. 流入元・計測トラッキング
// ═══════════════════════════════════════════════════
const _urlParams   = new URLSearchParams(location.search);
const _refSource   = _urlParams.get('utm_source')   || _urlParams.get('ref') || 'direct';
const _refMedium   = _urlParams.get('utm_medium')   || '';
const _refCampaign = _urlParams.get('utm_campaign') || '';
const _isPartner      = _refSource === 'partner';
const _refPage     = location.pathname + location.search;
const _referrer    = document.referrer
  ? (() => { try { return new URL(document.referrer).hostname; } catch(e) { return document.referrer; } })()
  : 'direct';

// セッションストレージに流入元を保存（フォーム送信時に付与）
ssSet('fw_ref', _refSource);
if(_isPartner) ssSet('fw_partner', '1');

function fwTrack(){ /* No external analytics. Explicit survey RPC is separate. */ }

// ページビュー計測
fwTrack('page_view', { ref_source: _refSource, ref_medium: _refMedium, ref_campaign: _refCampaign, referrer: _referrer });

// Survey collection is handled separately by the explicit, consent-based Google adapter.

// ═══════════════════════════════════════════════════
// 14. 同意モーダル
// ═══════════════════════════════════════════════════
let _consentGiven = ssGet('fw_consent') === '1';

function showConsentModal() {
  document.getElementById('consentOverlay').classList.add('open');
  fwTrack('consent_modal_open');
}
function closeConsentModal() {
  document.getElementById('consentOverlay').classList.remove('open');
}

document.getElementById('consentCheck').addEventListener('change', function() {
  const btn = document.getElementById('consentOkBtn');
  btn.classList.toggle('enabled', this.checked);
  btn.disabled = !this.checked;
});

document.getElementById('consentOkBtn').addEventListener('click', () => {
  _consentGiven = true;
  ssSet('fw_consent', '1');
  closeConsentModal();
  fwTrack('consent_given');
  runSimulation();
});

document.getElementById('consentCancelBtn').addEventListener('click', closeConsentModal);
document.getElementById('consentOverlay').addEventListener('click', function(e) {
  if(e.target === this) closeConsentModal();
});

// シミュレーション実行（何度でも再実行可能）
// 数字のカウントアップ演出（押した瞬間の"山場"）
function _animNum(el, target, render, dur){
  if(!el) return;
  dur=dur||850; let t0=null;
  function step(now){
    if(t0===null) t0=now;
    const p=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-p,3);
    el.textContent=render(target*e);
    if(p<1) requestAnimationFrame(step); else el.textContent=render(target);
  }
  requestAnimationFrame(step);
}
function animateHero(){ /* Keep result values stable during editing. */ }
function runSimulation() {
  const btn = document.getElementById('runBtn');

  // 入力エラーがあればエラー箇所へスクロールして知らせる
  if(!validateAll()) {
    const errEl = document.querySelector('input.err');
    if(errEl) {
      // エラー入力が折りたたみ（健診データ）内で非表示なら自動展開してから案内
      if(errEl.offsetParent === null){
        const adv=document.getElementById('advancedInputs');
        if(adv && adv.style.display==='none'){ document.getElementById('advToggle').click(); }
      }
      setTimeout(()=>{ errEl.scrollIntoView({behavior:'smooth', block:'center'}); errEl.focus(); }, 60);
    }
    return;
  }

  // ボタンに実行中フィードバックを表示してから再計算
  btn.disabled = true;
  btn.textContent = '計算中...';
  setTimeout(() => {
    document.body.classList.remove('pre-run');   // 先に表示して幅を確定→グラフ等を正しいサイズで描画（押した瞬間に結果）
    window.dispatchEvent(new Event('scroll'));
    updateAll();
    // No survey or medical-data transmission is performed by the calculator.
    btn.disabled = false;
    btn.textContent = 'もう一度シミュレーションする';
    // 結果の"数字"を画面中央に据えてスクロール（グラフでなく金額/年数）
    document.getElementById('simulationResults').scrollIntoView({behavior:'smooth',block:'start'});
    const _p1=document.getElementById('p1'); if(_p1){ _p1.classList.remove('revealed'); void _p1.offsetWidth; _p1.classList.add('revealed'); }
    animateHero();
    window.dispatchEvent(new Event('bp:simulation-complete'));
  }, 100);
}

// シミュレーションボタン：同意済みならそのまま実行、未同意なら同意モーダルを表示
document.getElementById('runBtn').addEventListener('click', () => {
  fwTrack('simulate_btn_click');
  if(_consentGiven) {
    runSimulation();
  } else {
    showConsentModal();
  }
});

// 改善シミュレーション（禁煙・運動習慣）トグル：チェックのたびに即座に再計算
['impQuitSmoke','impExercise'].forEach(id=>{
  const el=document.getElementById(id);
  el.addEventListener('change',()=>{
    document.getElementById(id+'Wrap').classList.toggle('checked',el.checked);
    fwTrack('improve_toggle',{id,checked:el.checked});
    updateAll();
  });
});

// 結果直後の「この変化を試す」から、推奨された改善条件を一押しで反映する
(function(){
  const btn=document.getElementById('tryImproveBtn');
  if(!btn)return;
  btn.addEventListener('click',()=>{
    const action=btn.dataset.improveAction;
    if(action==='quit'){
      const el=document.getElementById('impQuitSmoke');
      if(!el.disabled){el.checked=true;document.getElementById('impQuitSmokeWrap').classList.add('checked');}
    } else if(action==='exercise'){
      const el=document.getElementById('impExercise');
      if(!el.disabled){el.checked=true;document.getElementById('impExerciseWrap').classList.add('checked');}
    } else if(action==='weight'){
      document.getElementById('impWeightLoss').value='3';
    } else {
      return;
    }
    fwTrack('improve_try_click',{action});
    updateAll();
  });
})();

// 減量スライダー：ドラッグ中も即座に反映（触って試せるように）
document.getElementById('impWeightLoss').addEventListener('input',()=>{
  queueSimulationUpdate();
});
document.getElementById('impWeightLoss').addEventListener('change',()=>{
  fwTrack('improve_weight_slider',{kg:document.getElementById('impWeightLoss').value});
});
// 減量の −/＋ ボタン（ドラッグ不要で確実に調整できる）
(function(){
  const sl=document.getElementById('impWeightLoss');
  function step(d){
    if(!sl) return;
    const v=Math.max(0, Math.min(15, (parseInt(sl.value,10)||0)+d));
    sl.value=String(v);
    updateAll();
    fwTrack('improve_weight_btn',{kg:v});
  }
  const m=document.getElementById('impWeightMinus'), p=document.getElementById('impWeightPlus');
  if(m) m.addEventListener('click',()=>step(-1));
  if(p) p.addEventListener('click',()=>step(1));
})();
// STEP5（サービス紹介）：押したら開く／もう一度押すと閉じる
(function(){
  const btn=document.getElementById('step5Toggle');
  const body=document.getElementById('step5Body');
  if(!btn||!body) return;
  const main=btn.querySelector('.s5t-main');
  btn.addEventListener('click',()=>{
    const willOpen=body.hasAttribute('hidden');
    if(willOpen){ body.removeAttribute('hidden'); btn.setAttribute('aria-expanded','true'); if(main)main.textContent='継続サポート・サービスのご案内を閉じる'; }
    else{ body.setAttribute('hidden',''); btn.setAttribute('aria-expanded','false'); if(main)main.textContent='継続サポート・サービスのご案内を見る'; }
    try{ fwTrack('step5_toggle',{open:willOpen}); }catch(e){}
  });
})();

// ═══════════════════════════════════════════════════
// 15. 相談フォームモーダル
// ═══════════════════════════════════════════════════
function openConsultForm(pos, service) {
  fwTrack('cta_click', { cta_position: pos, service: service||'', ref_source: _refSource });
  // サービス選択をフォームの相談希望内容にプリセット
  const purposeMap = {
    'online':     'other',
    'harajuku-pt':'lifestyle_disease',
    'pilates':    'shoulder_back'
  };
  const sel = document.getElementById('f-purpose');
  if(service && purposeMap[service]) sel.value = purposeMap[service];
  document.getElementById('formOverlay').classList.add('open');
  document.getElementById('formSuccess').classList.remove('show');
  document.getElementById('consultForm').style.display = '';
  document.getElementById('formOverlay').scrollTop = 0;
}
function closeConsultForm() {
  document.getElementById('formOverlay').classList.remove('open');
}

document.getElementById('formCloseBtn').addEventListener('click', closeConsultForm);
document.getElementById('formOverlay').addEventListener('click', function(e) {
  if(e.target === this) closeConsultForm();
});

// CTA ボタン（トップ・中段・下部・スマホ追従）をまとめてバインド
document.querySelectorAll('[data-cta-pos]').forEach(btn => {
  btn.addEventListener('click', () => openConsultForm(btn.dataset.ctaPos, btn.dataset.service || ''));
});
// 予約（STORES）リンクのクリック計測
document.querySelectorAll('a[data-reserve]').forEach(a => {
  a.addEventListener('click', () => { try{ fwTrack('reserve_click', {service:a.dataset.reserve}); }catch(e){} });
});

// 下部固定CTA（二次健診受診勧奨）：STEP4（対策）へスクロール
document.getElementById('stickyCta').addEventListener('click', function(e){
  e.preventDefault();
  fwTrack('exam_cta_sticky_click');
  setTimeout(()=>{
    document.getElementById('step4').scrollIntoView({behavior:'smooth', block:'start'});
  }, 60);
});
// 結果の各行動ボタンを、保存・健診・改善・相談へ一貫してつなぐ
function goToPlanAction(action,source){
  fwTrack((source||'plan')+'_click',{action});
  if(action==='save'){ const save=document.getElementById('shareImgBtn'); if(save)save.click(); return; }
  if(action==='improve'){ const box=document.getElementById('improveBox'); if(box)box.scrollIntoView({behavior:'smooth',block:'center'}); return; }
  if(action==='exam'){ const details=document.getElementById('examDetails'); if(details)details.open=true; const box=document.getElementById('examCta'); if(box)box.scrollIntoView({behavior:'smooth',block:'start'}); return; }
  if(action==='support')openConsultForm(source||'next_plan','');
}
document.querySelectorAll('[data-next-action]').forEach(btn=>{
  btn.addEventListener('click',()=>goToPlanAction(btn.dataset.nextAction,'next_plan'));
});
// フォーム到達計測
document.getElementById('formOverlay').addEventListener('transitionend', function() {
  if(this.classList.contains('open')) {
    fwTrack('form_view');
  }
});

// フォーム送信
document.getElementById('consultForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('formSubmitBtn');
  btn.disabled = true;
  btn.textContent = '送信中...';

  const data = Object.fromEntries(new FormData(this));
  data.ref = ssGet('fw_ref') || 'direct';
  data.is_partner = ssGet('fw_partner') === '1';
  data.submitted_at = new Date().toISOString();

  fwTrack('form_submit', { purpose: data.purpose, partner_flow: data.is_partner });

  // ── フォーム送信先を設定してください ──────────────────────────
  // 例: Formspree → const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_ID';
  // 例: 自社API   → const FORM_ENDPOINT = '/api/counseling';
  const FORM_ENDPOINT = '';
  // ──────────────────────────────────────────────────────────────

  try {
    if(FORM_ENDPOINT) {
      await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      this.style.display = 'none';
      document.getElementById('formSuccess').classList.add('show');
      fwTrack('form_complete', { purpose: data.purpose });
    } else {
      // 送信先未設定：偽りの受付をしない。個人情報は端末にも保存しない（本番前にFORM_ENDPOINTを設定）
      btn.disabled = false;
      btn.textContent = '送信する — 無料カウンセリングを申し込む';
      alert('現在オンライン受付を準備中です。恐れ入りますが、会場スタッフにお声がけいただくか、記載の窓口までご連絡ください。（この内容は送信・保存されていません）');
    }
  } catch(err) {
    btn.disabled = false;
    btn.textContent = '送信する — 無料カウンセリングを申し込む';
    alert('送信中にエラーが発生しました。お手数ですがしばらくしてから再度お試しください。');
  }
});

// 結果まとめカードを「1枚の画像」として生成・保存（携帯でも最良の形）
let exportRendererPromise;
function ensureExportRenderer(){
 if(typeof window.html2canvas==='function')return Promise.resolve();
 if(!exportRendererPromise)exportRendererPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='assets/vendor/html2canvas-1.4.1.min.js';script.async=true;
  script.onload=()=>resolve();script.onerror=()=>{script.remove();exportRendererPromise=null;reject(Error('画像出力機能を読み込めませんでした。'));};document.head.append(script);
 });return exportRendererPromise;
}
async function saveResultAsImage(btn, note){
  fwTrack('save_image_click');

  const card=document.getElementById('reportA4');
  const orig = btn ? btn.innerHTML : null;
  if(btn){ btn.disabled=true; btn.textContent='画像を作成中...'; }
  try{
    await ensureExportRenderer();
    if(document.fonts) await document.fonts.ready;
    // A4レポートを高解像度で1枚に（白背景・794×1123px＝A4縦比）
    const scale = Math.min(3, Math.max(2, (window.devicePixelRatio||1)*1.5));
    const canvas = await html2canvas(card, {
      backgroundColor:'#ffffff', scale, useCORS:true, logging:false,
      width:794, windowWidth:794
    });
    const link=document.createElement('a');
    link.download=(_lsMode==='lifespan'?'body-palette-健康寿命シミュレーション.png':'body-palette-健康資産シミュレーション.png');
    link.href=canvas.toDataURL('image/png');
    link.click();
    fwTrack('save_image_success');
    if(note) note.textContent='画像を作成しました。ダウンロード先はブラウザ・端末の設定をご確認ください。';
  }catch(e){
    if(note) note.textContent='画像の生成に失敗しました。しばらくしてから再度お試しください。';
  }finally{
    if(btn){ btn.disabled=false; btn.innerHTML=orig; }
  }
}

// カード下の画像保存ボタン（全デバイス共通）
document.getElementById('shareImgBtn').addEventListener('click',()=>{
  saveResultAsImage(document.getElementById('shareImgBtn'), document.getElementById('shareImgNote'));
});

// PDF/印刷ボタン：PC＝印刷ダイアログ、スマホ＝1枚画像を生成（印刷は携帯だと扱いにくいため）
document.getElementById('pdfBtn').addEventListener('click',()=>{
  if(window.innerWidth<=768){
    fwTrack('pdf_btn_mobile_to_image');
    saveResultAsImage(document.getElementById('pdfBtn'), null);
  } else {
    fwTrack('pdf_print_click');
    window.print();
  }
});
// スマホではPDF/印刷ボタンの文言を「画像で保存」に合わせる
if(window.innerWidth<=768){
  const pb=document.getElementById('pdfBtn');
  if(pb) pb.innerHTML='<span class="pdf-btn-icon">📷</span> この結果を画像で保存する';
}

// 詳細入力トグル
document.getElementById('advToggle').addEventListener('click',function(){
  const adv=document.getElementById('advancedInputs');
  const isOpen=adv.style.display!=='none';
  adv.style.display=isOpen?'none':'';
  this.classList.toggle('open',!isOpen);
  this.querySelector('.adv-toggle-icon').textContent=isOpen?'＋':'−';
  fwTrack(isOpen?'advanced_close':'advanced_open');
});

document.getElementById('discToggle').addEventListener('click',()=>{
  const d=document.getElementById('discDetail');
  d.classList.toggle('open');
  document.getElementById('discToggle').textContent=
    d.classList.contains('open')?'▲ 閉じる':'▼ 引用元・詳細を見る';
});

// デモ用サンプル入力（司会が壇上で"効く"結果をすぐ出す。?demo=1 / ?present=1 でボタン表示）
function fillDemo(){
  if(_lsMode==='unselected')setMode('asset');
  const set=(id,v)=>{const e=document.getElementById(id); if(e){e.value=v;}};
  set('gender','male'); set('age','52'); set('habit','none'); set('smoking','current'); set('cigCount','20');
  set('income','500'); set('assets','800');
  const adv=document.getElementById('advancedInputs');
  if(adv && adv.style.display==='none'){ document.getElementById('advToggle').click(); }
  set('height','170'); set('weight','88'); set('waist','94'); set('sbp','145'); set('dbp','92');
  set('ldl','160'); set('hdl','42'); set('tg','180'); set('glucose','118'); set('hba1c','6.3');
  set('ast','30'); set('alt','40'); set('ggt','80');
  try{ if(typeof updateCigCountVisibility==='function') updateCigCountVisibility(); }catch(e){}
  try{ if(typeof updateMetsBanner==='function') updateMetsBanner(); }catch(e){}
  try{ if(typeof updatePrecisionMeter==='function') updatePrecisionMeter(); }catch(e){}
  runSimulation();
}
// リセット（複数回デモの間に初期化）
function resetForm(){
  const f=id=>document.getElementById(id);
  if(f('gender'))f('gender').value='male'; if(f('age'))f('age').value='40';
  if(f('habit'))f('habit').value='none'; if(f('smoking'))f('smoking').value='never';
  ['cigCount','income','assets','height','weight','waist','sbp','dbp','ldl','hdl','tg','glucose','hba1c','ast','alt','ggt'].forEach(id=>{ if(f(id)) f(id).value=''; });
  const adv=f('advancedInputs'); if(adv && adv.style.display!=='none'){ f('advToggle').click(); }
  try{ if(typeof updateCigCountVisibility==='function') updateCigCountVisibility(); }catch(e){}
  try{ if(typeof updateMetsBanner==='function') updateMetsBanner(); }catch(e){}
  try{ if(typeof updatePrecisionMeter==='function') updatePrecisionMeter(); }catch(e){}
  document.body.classList.add('pre-run');
  clearMode();
  try{ updateAll(); }catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
}
(function(){
  const d=document.getElementById('demoFillBtn'); if(d) d.addEventListener('click',fillDemo);
  const r=document.getElementById('resetFormBtn'); if(r) r.addEventListener('click',resetForm);
  const p=new URLSearchParams(location.search);
  if((p.has('demo')||p.has('present'))&&d) d.style.display='';
})();

// STEP2でグラフ・結論・独自スコアを確認し、STEP3で生活習慣の条件を変更して比較します。

// 初期化
document.body.classList.add('pre-run');   // 実行前は結果を隠す（押した瞬間に出す・他人の既定値結果を見せない）
clearMode();
updateAll();
resetPanels();
