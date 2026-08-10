# 独自ドメイン設定 手順書（GitHub Pages）

BODY PALETTE 健康シミュレーターを、御社の独自ドメイン（例：`sim.fractal-workout.jp`）で
公開するための手順です。**DNS管理担当者向け**の内容を含みます。

現在の公開URL：`https://takase-creator.github.io/fractal-health-asset-simulation/`

---

## 0. 事前に決めること
- **使うドメイン／サブドメイン**を1つ決めます。おすすめは **サブドメイン**（例）
  - `sim.fractal-workout.jp`
  - `health.fractal-workout.jp`
  - `check.fractal-workout.jp`
- 御社が保有しているドメイン（例 `fractal-workout.jp`）のDNSを編集できることが前提です。

---

## 1. DNS レコードを追加（DNS管理担当者の作業）

### ケースA：サブドメインを使う（推奨・簡単）
DNSに **CNAMEレコード** を1つ追加します。

| 種別 | ホスト名（名前） | 値（向き先） | TTL |
|---|---|---|---|
| CNAME | `sim`（＝使うサブドメイン部分） | `takase-creator.github.io.` | 3600 |

> 例：`sim.fractal-workout.jp` を使う場合、ホスト名は `sim`、値は `takase-creator.github.io.`（末尾のドットは付けても付けなくても可）。

### ケースB：ドメイン直下（apex／`fractal-workout.jp` そのもの）を使う
CNAMEは使えないため、**Aレコード4件**（＋任意でAAAA）を追加します。

| 種別 | ホスト | 値 |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

（GitHub Pages の公式IP。将来変わる可能性があるため、GitHub公式ドキュメントで最新値をご確認ください。）

---

## 2. GitHub 側の設定（こちらで実施可能）
1. リポジトリ `takase-creator/fractal-health-asset-simulation` の **Settings → Pages**
2. **Custom domain** に決めたドメイン（例 `sim.fractal-workout.jp`）を入力して Save
3. DNSが反映されると **Enforce HTTPS** が有効化できるので、必ずONにする（`https://` で配信）
4. リポジトリ直下に **`CNAME` ファイル**（中身は決めたドメイン1行）が自動生成されます

> ご希望なら、こちらで `CNAME` ファイルを用意して push しておきます（DNS設定完了後にドメインが有効化されます）。

---

## 3. 反映確認
- DNSの反映には**数分〜最大48時間**かかることがあります。
- 反映後、`https://sim.fractal-workout.jp/health-asset-simulation.html` で開けます。
- 旧URL（`takase-creator.github.io/...`）も引き続き有効です。

---

## 4. 配布時のURL例（独自ドメイン適用後）
- 本体ツール（社外OK）：`https://sim.fractal-workout.jp/health-asset-simulation.html`
- 集計サマリー（社内のみ・要アクセスキー）：`https://sim.fractal-workout.jp/summary-report.html?key=◯◯◯`

---

## メモ
- 独自ドメインにすると、QRコード・URLの向き先も新ドメインに差し替えるのが理想です
  （QR再生成・ツール内QRの更新はこちらで対応します）。
- 独自ドメインは**信頼感の向上**が主目的で、機能は変わりません。
- 不明点は、決めたドメイン名を教えていただければ、GitHub側設定とCNAME追加まで代行します。
