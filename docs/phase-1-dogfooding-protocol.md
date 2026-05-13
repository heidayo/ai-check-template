# Phase 1 Dogfooding Protocol

> **ステータス**: Draft v0.1（初回 dogfooding 完了後に改訂予定）

## 概要

Phase 0 で `package-templates/` の 7 サブ成果物（philosophy / ci-examples / scripts / .claude / package.scripts.fragment.json / prompts / profiles）の骨格が揃った。これらは Notion 主体 4 文書からの抽出物だが、**実プロジェクトで使えるか・現実に適合するか未検証**である。

Phase 1 dogfooding では、複数の実プロジェクトで package-templates を運用し、フィードバックを SPEC 改訂に反映する。本ドキュメントはその運用ルール（プロトコル）を定義する。

dogfooding の目的は以下:

1. **適合性検証**: 抽出した「思想」と「テンプレ」が実プロジェクトに適用可能か
2. **乖離の発見**: 現実との乖離点を `sage/failures.md` に集約
3. **改訂サイクル**: フィードバック → SPEC 改訂 → 再 dogfooding のループを回す
4. **Phase 2 への入力**: CLI 化（`npx ai-check-template init`）の前提知見を貯める

## 対象プロジェクト選定基準

### 必須条件

- **最低 2 プロジェクト**: 単一プロジェクト依存（gakuten 単独等）は禁止
- **異なるスタック**: 5 profile（`react-nextjs` / `react-vanilla` / `expo-rn` / `node-cli` / `supabase-rls`）のうち**最低 2 種類**をカバー
- **能動的開発中**: 過去 1 ヶ月以上更新があり、AI 駆動開発を実施しているプロジェクト

### 推奨条件

- **多様な規模**: 小（個人 OSS）+ 大（業務プロジェクト）の混在
- **Supabase 利用有無のバランス**: `supabase-rls` profile 検証のため最低 1 件は Supabase + RLS を使うこと
- **Owner の協力**: dogfooding 結果を `sage/failures.md` に記録してもらえる関係

### 対象不在時の代替

実プロジェクトが集まらない場合の代替策:

- **OSS リポでの試行**: 公開済 OSS プロジェクトを fork して試す（contributor 視点での評価）
- **仮想プロジェクト**: 小規模なサンプルアプリ（Todo アプリ等）を作成して試行
- **部分採用**: 1 プロジェクトの 1 profile のみ部分採用してフィードバック

代替策で進めた場合は、protocol.md に「代替策で進めた」旨を `sage/failures.md` に記録し、SPEC 改訂時に反映する。

## 導入手順

各 dogfooding 対象プロジェクトで以下を実施する。

### Step 1: profile を選択

対象プロジェクトのスタックに合う profile を選ぶ:

| profile | 想定スタック | 詳細 |
|---|---|---|
| `react-nextjs` | Next.js App Router + TS | `package-templates/profiles/react-nextjs/README.md` |
| `react-vanilla` | 純 React + TS（Vite / CRA） | `package-templates/profiles/react-vanilla/README.md` |
| `expo-rn` | Expo / React Native | `package-templates/profiles/expo-rn/README.md` |
| `node-cli` | Node CLI / Library | `package-templates/profiles/node-cli/README.md` |
| `supabase-rls` | Supabase + RLS（他 profile に追加） | `package-templates/profiles/supabase-rls/README.md` |

### Step 2: 思想ドキュメントの共有

`package-templates/docs/philosophy/` 配下の 4 ドキュメントをチームで読み合わせる:

- `formal-name-match.md` — 形名参同
- `test-pyramid.md` — 責務分割
- `given-when-then.md` — 受け入れ条件先出し
- `qa-techniques.md` — QA 技法 6 種

### Step 3: ai:check の組み込み

- `package-templates/package.scripts.fragment.json` の `scripts` を `package.json` にマージ
- `package-templates/scripts/ai-check.sh` / `ai-check-fast.sh` をプロジェクトの `scripts/` にコピー
- プロジェクト固有の typecheck / lint / test コマンドを `package.json` に整備
- 動作確認: `pnpm ai:check` で全段階が走ることを確認

### Step 4: Claude Code hook の設定

- `package-templates/.claude/settings.hook-fragment.json` の `hooks` を `.claude/settings.json` にマージ
- `package-templates/.claude/rules/test-rules.md` を `.claude/rules/` にコピー
- Edit / Stop hook が正しく `pnpm ai:check:fast` / `pnpm ai:check` を呼ぶことを確認

### Step 5: CI 統合

- `package-templates/ci-examples/github-actions/ai-check.yml` / `ai-check-fast.yml` を `.github/workflows/` にコピー
- pnpm / Node version をプロジェクトに合わせて調整
- PR / push で動作確認

### Step 6: プロンプト雛形の利用

`package-templates/prompts/` の 5 プロンプト（decision-table / state-transition / boundary-value / rls-permission / plan-first）を AI 駆動開発時に使う。

利用フロー:
1. 新規機能着手時に `plan-first.md` で AI に Plan を出させる
2. Plan で挙げた成功基準に対し、観点が足りなければ `decision-table.md` / `state-transition.md` / `boundary-value.md` / `rls-permission.md` を補強
3. SPEC / 受け入れ条件として明文化
4. 実装 → `pnpm ai:check` で形名照合

### Step 7: AI 駆動開発の試行

1〜2 スプリント、上記設定で AI 駆動開発を行う。**「動かない / 違和感 / 不要 / 不足」**を感じたら即時記録（次節）。

## フィードバック収集ルール

### 記録場所

`sage/failures.md`（既存 SAGE 仕組み）に FAIL-XXXX 形式で追記する。

### 記録タイミング

- **動かない**: package-templates の何かが期待通り動作しない
- **違和感**: 「これは現実と合わない」と感じる
- **不要**: 余計な記述・ファイルが含まれている
- **不足**: 必要な要素が欠落している

これら 4 種類のいずれかを感じたら、その日のうちに記録する。

### 記録フォーマット

[`./phase-1-feedback-template.md`](./phase-1-feedback-template.md) のテンプレに従う。1 件 = 1 セクションで、以下を含める:

- プロジェクト名（汎用名 or 識別子）
- 採用 profile
- 該当 package-templates 成果物
- 問題（観測した事実）
- 期待（本来どうなるべきか）
- 原因仮説
- 推奨修正（package-templates の改訂案）
- 影響度（low / medium / high / critical）
- SPEC-ID 連携（影響を受ける SPEC）
- 対応ステータス（open / investigating / fixed / wontfix）

### レビュー頻度

リポオーナーが**週次**で `sage/failures.md` を集約し、以下を判断:

- 同パターンの 3 回累積 → `sage/anti-patterns.md` 昇格
- 影響度 high 以上 → 即時 SPEC 改訂検討
- 影響度 medium → Phase 1 中間レビューでまとめて反映
- 影響度 low → Phase 1 終了時にまとめて反映

## Phase 1 → Phase 2 昇格条件

以下**すべて**を満たした時点で Phase 2（CLI 化）に進む。

| 条件 | 判定方法 |
|---|---|
| 2 プロジェクト以上で dogfooding 完了 | リポオーナーが手動確認 |
| 5 profile のうち最低 2 種類カバー | 採用 profile を集計 |
| フィードバック 5 件以上記録 | `wc -l sage/failures.md` で目視確認 |
| フィードバック反映 SPEC 改訂が 1 件以上 Approved | `grep "改訂" specs/*.md` |
| リポオーナー承認 | 明示的な「Phase 2 開始」宣言 |

## 失敗パターン → SPEC 改訂ループ

```
[dogfooding 中]
   ↓ 「動かない / 違和感」を感じる
記録（sage/failures.md に FAIL-XXXX 追記）
   ↓ リポオーナーが週次でレビュー
分析（原因 / 影響度 / 推奨修正）
   ↓ 影響度に応じて即時 or バッチ
SPEC 改訂 or 新規 SPEC 起票
   ↓ SAGE 規律下で SPEC → PLAN → TASK → 実装
package-templates 更新
   ↓
再 dogfooding（同プロジェクト or 別プロジェクト）
   ↓ 改訂が現実に適合するか再検証
新規フィードバック収集
```

このループを Phase 1 → Phase 2 昇格条件を満たすまで継続する。

### 同パターン 3 回累積の昇格手順

`sage/failures.md` で同じ原因仮説の FAIL が 3 件累積したら:

1. リポオーナーが該当 FAIL 群を抽出
2. `sage/anti-patterns.md` に新規アンチパターンとして登録
3. アンチパターン回避ルールを `.claude/rules/ai-check-template.md` または該当 SPEC に追加
4. Phase 1 dogfooding 中はアンチパターンを意識的に避けることを protocol で明示

## 注意事項

- **dogfooding は強制ではない**: 各プロジェクトのオーナーの協力次第。協力が得られない場合は代替策（OSS / 仮想プロジェクト）を使う
- **失敗を歓迎する**: 「dogfooding で何も問題が出なかった」は逆に異常。最低 1 件以上のフィードバックが出ない場合、dogfooding 実施の質を見直す
- **改訂を恐れない**: SPEC 改訂は SAGE の正常なフローの一部。改訂 = 失敗ではない

## 関連リンク

### Phase 1 内部
- [`./phase-1-feedback-template.md`](./phase-1-feedback-template.md) — フィードバック記録テンプレ

### Phase 0 成果物
- `package-templates/docs/philosophy/` — 思想 4 ドキュメント
- `package-templates/ci-examples/` — CI 統合例
- `package-templates/scripts/` — ai:check シェル
- `package-templates/.claude/` — Claude Code hook
- `package-templates/package.scripts.fragment.json` — npm scripts 雛形
- `package-templates/prompts/` — AI プロンプト 5 種
- `package-templates/profiles/` — 5 profile

### SAGE 仕組み
- `sage/failures.md` — 失敗パターン蓄積
- `sage/anti-patterns.md` — アンチパターン昇格先
- `sage/governance.md` — SAGE 基本原則

## 出典

- SPEC-0008（本ドキュメントの定義元）
- SPEC-0001..0007（Phase 0 全成果物）
- `sage/governance.md` §7 (Phase 7 Observe)
