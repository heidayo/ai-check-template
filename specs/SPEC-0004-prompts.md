# SPEC-0004: package-templates/prompts/ の整備

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0004 |
| ステータス | Approved |
| 作成日    | 2026-05-13 |
| 更新日    | 2026-05-13 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0001（philosophy の QA 技法・形名参同を AI プロンプトとして実体化） |
| 権限レベル | platform |

## 背景・目的

`package-templates/docs/philosophy/qa-techniques.md` の理論を、AI 駆動開発で**直接利用可能なプロンプト雛形**として配布する。利用者は雛形をコピーして自プロジェクトの仕様に当てはめ、AI（Claude Code / Codex 等）に観点設計や受け入れ条件先出しを依頼する。

5 つの雛形カテゴリ:
- **QA 技法系（4）**: decision-table / state-transition / boundary-value / rls-permission
- **プロセス系（1）**: plan-first（実装前の成功基準定義、形名参同の Phase A 実装）

これらは philosophy 思想ドキュメントの「読み物」から、実務で「コピペで使えるプロンプト」への橋渡しになる。

## 対象ユーザー

- AI に観点設計を依頼するエンジニア（QA / プロダクト / 実装エンジニア）
- 「テストを書いて」と曖昧に依頼する代わりに、観点を明示してテスト網羅性を上げたい人
- 形名参同の Phase A（成功基準先出し）を運用に組み込みたいチーム

## スコープ（含む）

- `package-templates/prompts/decision-table.md`（デシジョンテーブル生成プロンプト）
- `package-templates/prompts/state-transition.md`（状態遷移テストプロンプト）
- `package-templates/prompts/boundary-value.md`（同値分割 + 境界値プロンプト）
- `package-templates/prompts/rls-permission.md`（RLS / 権限テストプロンプト）
- `package-templates/prompts/plan-first.md`（Plan 先出しプロンプト）
- `package-templates/prompts/README.md`（ディレクトリ目的・使い方）

合計 6 ファイル。

## スコープ外

- profiles/（次の SPEC）
- 個別ツール解説（docs/tools/、Phase 0 では作成しない）
- CLI 実装（Phase 2）
- 本リポ自身でこれらのプロンプトを使う（利用者向け配布物）
- プロンプト内に gakuten 固有の業務例（例: 「求人保存機能」） — 汎用例（「item save」「user registration」）に書き換え

## File Scope

**書き込み許可:**
- `package-templates/prompts/decision-table.md`
- `package-templates/prompts/state-transition.md`
- `package-templates/prompts/boundary-value.md`
- `package-templates/prompts/rls-permission.md`
- `package-templates/prompts/plan-first.md`
- `package-templates/prompts/README.md`

**読み込みのみ:** `package-templates/docs/philosophy/qa-techniques.md`, `formal-name-match.md`, `given-when-then.md`

**変更禁止:** SAGE 内部物、既存 SPEC/PLAN/TASK、`package-templates/{docs/philosophy, ci-examples, scripts, .claude, package.scripts.fragment.json}`

## CLAUDE.md / .claude/rules/ 連携

`.claude/rules/ai-check-template.md` を継承。

| ルール | 実装時の遵守事項 |
|---|---|
| 汎用ファースト | プロンプト内の業務例は「item」「user」等の汎用語のみ |
| 言語規約 | プロンプト本文・コメントは日本語、識別子・コマンドは英語 |
| 配布物分離 | `package-templates/prompts/` のみ書き込み |
| 主体文書 | QA 技法は Doc #3（`dc8774cd03c8490688b066c2b0179cac`）由来、Plan-first は Doc #2 |

## Forbidden Shortcuts

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships の使用
- プロンプト内で特定企業名・特定ドメイン名を例示
- secret / token / API key の含有
- TODO / FIXME を残す
- File Scope 外の変更
- プロンプトの説明文が抽象的すぎる（「適切に」「いい感じに」等）

## 要件

### 機能要件
- [FR-01] 6 ファイルすべてが `package-templates/prompts/` 配下に存在
- [FR-02] 各プロンプトファイルは H1 タイトル + 概要 + プロンプト本文（コードブロック） + 利用例 + 出典の構造
- [FR-03] 各プロンプトファイルにコピペ可能な「プロンプト本文」コードブロックが存在
- [FR-04] philosophy ドキュメントへの相互リンク（最低 1 件）
- [FR-05] README が 5 つのプロンプトすべての概要を含む

### 非機能要件
- [NFR-01] プロンプト 1 ファイル 80-250 行
- [NFR-02] README 60-200 行
- [NFR-03] テスト種別: structural test + grep。実行は利用者プロジェクトに依存（unit / integration / e2e は N/A）
- [NFR-04] カバレッジ閾値: N/A — プロンプト雛形のため

### セキュリティ要件
- [SEC-01] プロンプト内に secret / token / API key の例示をしない（grep で検証）
- [SEC-02] プロンプトに任意コード実行指示を含めない（`eval`, `exec` の指示なし）

### 運用要件
- [OPS-01] 本 SPEC 完了で Phase 0 サブ成果物 5/7（philosophy + ci-examples + execution-stack + prompts）
- [OPS-02] dogfooding で「プロンプトが汎用すぎて使いにくい」フィードバックを `sage/failures.md` に記録

## Quality Gate マッピング

| Gate | 対応 AC |
|---|---|
| Gate 1: Structural | AC-01..AC-04, AC-09 |
| Gate 2: Functional | AC-05..AC-07 |
| Gate 3: Security | AC-10, AC-11 |
| Gate 4: Architecture | AC-12 |
| Gate 5: Release | N/A |

## 受け入れ条件

### 正常系
- [ ] AC-01: 6 ファイル全存在（`ls package-templates/prompts/{decision-table,state-transition,boundary-value,rls-permission,plan-first,README}.md`）
- [ ] AC-02: 各ファイル H1 タイトル（`head -1 package-templates/prompts/*.md | grep -c "^# "` が 6）
- [ ] AC-03: 各プロンプトファイル（README 除く 5 つ）にコードブロックが存在（` ``` ` で囲まれた領域、`grep -l '^```' package-templates/prompts/{decision-table,state-transition,boundary-value,rls-permission,plan-first}.md | wc -l` が 5）
- [ ] AC-04: 各ファイル末尾に「## 出典」セクションが存在（`grep -l "^## 出典" package-templates/prompts/*.md | wc -l` が 6）

### 機能検証
- [ ] AC-05: 各プロンプト固有のキーワードが該当ファイルに登場（`grep -q "デシジョンテーブル" decision-table.md && grep -q "状態遷移" state-transition.md && grep -q "同値分割" boundary-value.md && grep -q "RLS" rls-permission.md && grep -q "Plan" plan-first.md`）
- [ ] AC-06: README に 5 プロンプトすべての名前が登場（`grep -E "decision-table|state-transition|boundary-value|rls-permission|plan-first" package-templates/prompts/README.md` が 5 行以上 match）
- [ ] AC-07: 各プロンプトファイルが philosophy への相互リンク（`grep -l "../docs/philosophy" package-templates/prompts/*.md | wc -l` が 6 以上、または README + 各プロンプト）

### 異常系
- [ ] AC-08: gakuten 固有語不在（`grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/prompts/` が空）
- [ ] AC-10: secret 直書きパターン不在（`grep -riE "(api[-_]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*['\"]" package-templates/prompts/` が空）
- [ ] AC-11: 危険コマンド指示不在（プロンプト内に `rm -rf` / `sudo` / `eval` を AI に実行させる指示なし）

### 配置検証
- [ ] AC-09: ファイル行数範囲（プロンプト 5 つ: 80-300 行、README: 60-250 行）
- [ ] AC-12: prompts/ は `package-templates/` 配下のみ（`find . -type d -name "prompts" -not -path "./node_modules/*" -not -path "./.git/*"` の結果が `./package-templates/prompts` のみ）

## 異常系

- 想定エラー1: プロンプトが抽象的すぎて利用者が AI に渡しても具体的なテスト観点が出ない → dogfooding で発見、SPEC 改訂
- 想定エラー2: gakuten 固有業務例混入 → AC-08
- 想定エラー3: ファイル行数極端 → AC-09
- 境界ケース1: コードブロック内の `pnpm` 等のコマンドが「コマンド注入」と誤判定 → AC-11 の grep を narrow

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | 不足ファイル作成 |
| AC-02 | H1 タイトル追加 |
| AC-03 | コードブロック（プロンプト本文）追加 |
| AC-04 | 「## 出典」追加 |
| AC-05 | 該当プロンプトに固有キーワード明示 |
| AC-06 | README に 5 つのプロンプト名を列挙 |
| AC-07 | 相互リンク追加 |
| AC-08 | gakuten 固有語を汎用語に置換 |
| AC-09 | 行数調整（過少なら肉付け、過多なら圧縮） |
| AC-10 | secret パターン削除 |
| AC-11 | 危険コマンド指示を削除 |
| AC-12 | 誤配置を `git mv` |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| プロンプトが具体テスト観点を引き出せない | `sage/failures.md` | リポオーナー |
| 似たプロンプト失敗が 3 回累積 | `sage/anti-patterns.md` 昇格候補 | リポオーナー |
| gakuten 固有業務例の混入再発 | `sage/failures.md` → anti-patterns へ | リポオーナー |

### anti-patterns 参照
- **Big Bang Prompt**: 6 ファイルを 1 つの巨大プロンプトで一括生成しない
- **Silent Scope Expansion**: prompts 配下以外への書き込み禁止

## 契約

- API/DB/イベント: なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: プロンプトが現実のプロジェクトで使いにくい → 軽減策: Phase 1 dogfooding で 2 プロジェクト以上が使用 → fb で改訂
- リスク2: AI モデルが更新されてプロンプトの効きが変わる → 軽減策: 出典に参照日を記録、年次レビュー
- リスク3: 汎用例が抽象的すぎて翻訳コストが高い → 軽減策: 汎用例 + 業務ドメインへの応用例を併記
- リスク4: 5 プロンプトの間でトーンが食い違う → 軽減策: 共通テンプレ構造（概要 → プロンプト → 利用例 → 出典）を全ファイルで統一

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| ファイル存在 | 6 ファイル全存在 |
| プロンプト本文 | 5 つすべてにコードブロック |
| 汎用性 | gakuten 固有業務例ゼロ |
| dogfooding 採用率（Phase 1） | 2 プロジェクト以上が改訂なしで採用 |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| SPEC Draft → Approved | AC-01..AC-12 全 pass + 95+ 採点 |
| Phase 0 サブ成果物 3/7 → 4/7 | SPEC-0004 Approved |

## 実装メモ

### 出典 Notion ページ
- `dc8774cd03c8490688b066c2b0179cac` — QA 技法（decision-table, state-transition, boundary-value のソース）
- `c3e549660ca44005a20c4f6fdb54c8d5` — AI 診断フロー（Plan-first のソース）
- `35b68c677f4380bfa1ffeab248264e92` — テストフロー再設計（RLS-permission のソース）

### 共通プロンプトテンプレ構造

各プロンプトファイルは以下の構造に従う:

```markdown
# <プロンプト名>

> ステータス: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## 目的
（このプロンプトで何を解決するか、1-2 段落）

## プロンプト本文

\`\`\`
（コピペで AI に渡す本文）
\`\`\`

## 利用例
（このプロンプトを使った実例）

## 隣接する思想
（philosophy への相互リンク）

## 出典
（Notion ID、参照日）
```

### TASK 分解の指針（PLAN で確定）

- TASK-A: 4 つの QA 技法プロンプト（decision-table, state-transition, boundary-value, rls-permission）
- TASK-B: plan-first プロンプト
- TASK-C: prompts/README.md
- TASK-D: AC 検証

## ロールバック手順

| Level | 手順 |
|---|---|
| Level 1 | 該当ファイルのみ復元 |
| Level 2 | `git checkout HEAD -- package-templates/prompts/` で一括復元 |
| Level 3 | SPEC を Draft に戻し再起票 |

## Properties

### Invariants
- [INV-01] (Gate 4) 6 ファイルすべて `package-templates/prompts/` 配下にのみ存在
- [INV-02] (Gate 4 / 横断) プロンプト内に gakuten 固有業務例不在
- [INV-03] (Gate 3) プロンプトに secret / token / 危険コマンド指示不在

### Pre-conditions
- [PRE-01] (Gate 1) SPEC-0001 が Approved（philosophy/qa-techniques.md が存在し、出典として参照可能）

### Post-conditions
- [POST-01] (Gate 2) 6 ファイル存在 + 各プロンプトファイル（5）にコードブロック
- [POST-02] (Gate 4) prompts/ 配下のみに存在し、`templates/` 等に複製なし

### Assumptions
- [ASM-01] プロンプトは汎用形（item / user 等）で記述。利用者が自プロジェクトのドメインに翻訳して使う
- [ASM-02] AI モデル更新でプロンプト効果が変動する可能性は許容（参照日を出典に記録）

## 関連ID

- 依存 SPEC: SPEC-0001
- PLAN-ID: PLAN-0004
- TASK-ID: TASK-0015..0018
