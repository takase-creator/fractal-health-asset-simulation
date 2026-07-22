# FRACTAL WORKOUT 健康資産シミュレーション

## 一言で言うと

健診データと資産情報を入力すると、80歳までの健康リスクと資産推移を試算できる単体HTMLツールです。FRACTAL WORKOUTの高級感ある黒・グレー・ゴールド基調のデザインに合わせています。

## 何ができるのか

- 年齢・性別・運動習慣・年収・総資産をもとに健康資産を試算
- 任意の健診データから6つの疾患リスクを表示
- 運動継続した場合と現状放置した場合の80歳時点の資産差分を可視化
- 推定損失内訳、生涯医療費、エビデンス詳細を確認
- ローカルのHTMLとしてブラウザでそのまま起動

## 構成

- `index.html`：健康資産シミュレーション本体。CSSとJavaScriptを内包
- `assets/images/`：FRACTAL WORKOUTのロゴ・店舗写真素材
- `ABOUT.md`：このフォルダの説明ファイル

## 使い方

Finderで `index.html` を開くか、ターミナルから以下を実行します。

```bash
open /Users/hayatokagami/⭐FW/outputs/fractal-health-asset-simulation-20260518/index.html
```

## 状態

- `index.html`：稼働中。元HTMLの計算ロジックを維持し、FRACTAL WORKOUTデザインへ変更済み
- `assets/images/`：稼働中。表示に必要な画像を同梱済み
