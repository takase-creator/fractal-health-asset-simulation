/**
 * FRACTAL WORKOUT — 匿名シミュレーションデータ受信スクリプト
 *
 * ── セットアップ手順 ─────────────────────────────────────────────
 * 1. Google スプレッドシートを新規作成
 * 2. 拡張機能 > Apps Script を開く
 * 3. このファイルの内容を全て貼り付けて保存
 * 4. デプロイ > 新しいデプロイ
 *      種類:「ウェブアプリ」
 *      次のユーザーとして実行:「自分」
 *      アクセスできるユーザー:「全員」
 * 5. デプロイ後のURLを index.html の ANON_ENDPOINT に設定
 *
 * ── 流入元の付与方法 ─────────────────────────────────────────────
 * URLに UTM パラメータを付与するだけで自動記録されます。
 * 例）SCSK向け:  ?utm_source=scsk&utm_medium=email&utm_campaign=2026_health
 *     エフクリ向け: ?utm_source=efcre&utm_medium=web
 *     直接配布:   パラメータなし → "direct" と記録
 * ────────────────────────────────────────────────────────────────
 */

const SHEET_NAME = 'シミュレーションデータ';

const HEADERS = [
  'タイムスタンプ',
  'セッションID',
  // 属性（個人特定不可）
  '年齢層',
  '性別',
  'BMI区分',
  '運動習慣',
  '入力項目数',
  // リスクスコア
  '糖代謝リスク',
  '血圧リスク',
  '脂質リスク',
  '肝機能リスク',
  '腎機能リスク',
  '筋骨格リスク',
  '総合スコア',
  // 資産試算
  '80歳差額（万円）',
  // 流入元（全UTM情報）
  '流入元（utm_source）',
  '流入媒体（utm_medium）',
  'キャンペーン（utm_campaign）',
  '着地ページ',
  'リファラ（前ページドメイン）',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);

      // ヘッダースタイル
      const hRange = sheet.getRange(1, 1, 1, HEADERS.length);
      hRange.setBackground('#314145');
      hRange.setFontColor('#ffffff');
      hRange.setFontWeight('bold');

      // 列幅調整
      sheet.setColumnWidth(1, 190);   // タイムスタンプ
      sheet.setColumnWidth(17, 160);  // 流入元
      sheet.setColumnWidth(19, 200);  // 着地ページ
      sheet.setColumnWidth(20, 180);  // リファラ

      // 流入元グループに色付け
      sheet.getRange(1, 16, 1, 5).setBackground('#1e3a3f').setFontColor('#ddc989');
    }

    sheet.appendRow([
      data.ts              || new Date().toISOString(),
      data.session_id      || '',
      data.age_group       || '',
      data.gender === 'male' ? '男性' : '女性',
      bmiLabel(data.bmi_cat),
      habitLabel(data.habit),
      Number(data.entered)        || 0,
      Number(data.risk_glucose)   || 0,
      Number(data.risk_bp)        || 0,
      Number(data.risk_lipid)     || 0,
      Number(data.risk_liver)     || 0,
      Number(data.risk_kidney)    || 0,
      Number(data.risk_musculo)   || 0,
      Number(data.med_score)      || 0,
      Number(data.diff80_bracket) || 0,
      data.ref_source   || 'direct',
      data.ref_medium   || '',
      data.ref_campaign || '',
      data.ref_page     || '',
      data.referrer     || 'direct',
    ]);

    return jsonResponse({ status: 'ok' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

function doGet() {
  return ContentService
    .createTextOutput('FRACTAL WORKOUT 匿名データ受信エンドポイント — OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function bmiLabel(cat) {
  return { underweight: '低体重', normal: '正常', overweight: '過体重', obese: '肥満' }[cat] || '未入力';
}

function habitLabel(h) {
  return { none: 'ほぼない', light: '月数回', medium: '週1-2回', high: '週3回以上' }[h] || '';
}
