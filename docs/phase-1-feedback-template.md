# Phase 1 Feedback Template

> **ステータス**: Draft v0.1（初回 dogfooding 完了後に改訂予定）

## 使い方

Phase 1 dogfooding 中に「動かない / 違和感 / 不要 / 不足」を感じたら、本テンプレに従ってフィードバックを `sage/failures.md` に追記する。

1. 既存 `sage/failures.md` の末尾に新規セクションを追加
2. FAIL-XXXX の番号は `sage/failures.md` の連番ルールに従う
3. 各項目を埋める（埋められない項目は「未確認」と記載、空欄禁止）
4. リポオーナーの週次レビュー対象になる

dogfooding 全体のプロトコルは [`./phase-1-dogfooding-protocol.md`](./phase-1-dogfooding-protocol.md) を参照。

## テンプレ本体

`sage/failures.md` に以下のセクションをコピペして使う:

```markdown
### FAIL-XXXX
- **発生日**: YYYY-MM-DD
- **プロジェクト名**: <汎用名 or 識別子>
- **採用 profile**: <react-nextjs / react-vanilla / expo-rn / node-cli / supabase-rls / 複合>
- **該当 package-templates 成果物**: <philosophy / scripts / .claude / ci-examples / prompts / profiles / package.scripts.fragment.json のいずれか>
- **問題**: <観測した事実を 1-3 文で>
- **期待**: <本来どうなるべきか>
- **原因仮説**: <推測、未確認なら「未確認」>
- **推奨修正**: <package-templates の改訂案、未確認なら「TBD」>
- **影響度**: low / medium / high / critical
- **SPEC-ID 連携**: <影響を受ける SPEC-XXXX。本フィードバックを契機に新規 SPEC が必要なら「new」>
- **対応ステータス**: open / investigating / fixed / wontfix
- **報告者**: <氏名 or ハンドル>
```

## 項目の書き方ガイド

### 発生日
ISO 8601（YYYY-MM-DD）。dogfooding で問題に気づいた日。

### プロジェクト名
- 公開可能なら実プロジェクト名
- 機密性がある場合は「project-A」「project-B」等の汎用識別子
- 業務プロジェクト名（apps/<name> 等の固有構造名）は避ける

### 採用 profile
- 単一 profile: `react-nextjs` 等
- 複合: `react-nextjs+supabase-rls`
- どの profile も完全採用していない場合: `partial: <採用した部分>`

### 該当 package-templates 成果物
具体的にどの成果物に問題があるか:
- `philosophy/formal-name-match.md`
- `scripts/ai-check.sh`
- `prompts/decision-table.md`
- `profiles/react-nextjs/README.md`
- 等

複数にまたがる場合はカンマ区切り。

### 問題
**観測した事実**のみ。解釈や推測は混ぜない。
- 良い例: 「`pnpm ai:check` を実行したら `command not found: oxlint` でエラー」
- 悪い例: 「ai:check が動かなくて使いにくい」（事実が曖昧）

### 期待
本来どう動作すべきか:
- 良い例: 「`oxlint` がインストール済の場合のみ実行され、未インストール時はスキップ」
- 悪い例: 「ちゃんと動いてほしい」

### 原因仮説
推測でよいが「未確認」を選べる:
- 「`package.scripts.fragment.json` の `lint:fast` が oxlint 前提で書かれている」
- 「未確認」

### 推奨修正
package-templates をどう改訂すべきか:
- 「`package.scripts.fragment.json` に oxlint 不在時のフォールバックを追加」
- 「TBD」（未検討）

### 影響度

| レベル | 基準 | 対応 |
|---|---|---|
| critical | dogfooding 全体が成立しない / セキュリティ / データ損失 | 即時 SPEC 改訂 |
| high | 主要機能が動かない / 多くのプロジェクトに影響 | 1 週間以内に SPEC 改訂検討 |
| medium | 一部の機能が動かない / 一部のプロジェクトに影響 | 中間レビューでまとめて反映 |
| low | 文言の改善 / 説明不足 | Phase 1 終了時にまとめて反映 |

### SPEC-ID 連携
影響を受ける SPEC を特定:
- 単一: `SPEC-0003`
- 複数: `SPEC-0001, SPEC-0003`
- 新規必要: `new`（推奨修正欄に新規 SPEC の概要を記入）

### 対応ステータス
- `open`: 未対応
- `investigating`: 調査中
- `fixed`: SPEC 改訂済 + 修正反映済（コミット ID を別途記録推奨）
- `wontfix`: 対応しないと判断（理由を別途明記）

## 記入例

実プロジェクトでのフィードバック例:

```markdown
### FAIL-0001
- **発生日**: 2026-05-20
- **プロジェクト名**: project-A
- **採用 profile**: react-nextjs+supabase-rls
- **該当 package-templates 成果物**: profiles/supabase-rls/README.md, scripts/ai-check.sh
- **問題**: README に「pgTAP は `supabase test db` で実行」とあるが、Supabase CLI v1.x では `supabase db test` が正しいコマンド
- **期待**: README が利用中の Supabase CLI version に対応したコマンドを示す
- **原因仮説**: Supabase CLI のコマンド体系が v1 で変更されたが、SPEC-0005 起票時点（2026-05-13）の情報が古い
- **推奨修正**: profiles/supabase-rls/README.md のコマンド例を `supabase db test` に更新、または「Supabase CLI version を確認」の注意書きを追加
- **影響度**: medium
- **SPEC-ID 連携**: SPEC-0005
- **対応ステータス**: open
- **報告者**: alice
```

このフォーマットで `sage/failures.md` に追記する。

## 集計と SPEC 改訂への橋渡し

リポオーナーは週次で `sage/failures.md` を集計する:

1. **影響度別カウント**: critical / high / medium / low の件数
2. **profile 別カウント**: どの profile に偏っているか
3. **同パターン検出**: 原因仮説が類似する FAIL が 3 件 → `sage/anti-patterns.md` 昇格候補
4. **対応ステータス推移**: open → investigating → fixed の流れを追跡

集計結果から SPEC 改訂判断:
- critical / high: 即時改訂 SPEC 起票
- medium: 月次レビューでまとめて改訂
- low: Phase 1 終了時にまとめて改訂

## 関連リンク

- [`./phase-1-dogfooding-protocol.md`](./phase-1-dogfooding-protocol.md) — Phase 1 dogfooding 全体プロトコル
- `sage/failures.md` — 失敗パターン蓄積先
- `sage/anti-patterns.md` — 3 回累積後の昇格先
- `package-templates/` — dogfooding 対象成果物
