# TASK-0013: package.scripts.fragment.json 作成

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0013 |
| SPEC-ID   | SPEC-0003 |
| PLAN-ID   | PLAN-0003 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 15m |

## 責務

`package-templates/package.scripts.fragment.json` を作成。利用者が自プロジェクトの `package.json` にマージする npm scripts 雛形。`ai:check` / `ai:check:fast` を定義する。

## 入力

- SPEC-0003 §実装メモ §推奨実装骨格（package.scripts.fragment.json）
- philosophy: `package-templates/docs/philosophy/test-pyramid.md`（Static / Unit / Integration / E2E の責務分割）

## 出力

### `package.scripts.fragment.json`（5-30 行）
- 有効な JSON、`{ "scripts": { ... } }` 構造
- `ai:check`: full check（typecheck + lint + test + e2e:smoke 等の連結）
- `ai:check:fast`: fast check（typecheck + lint + test:unit のみ）
- 個別ツール（typecheck, lint, test 等）は利用者が `package.json` で別途定義する前提で、`ai:check` / `ai:check:fast` のみを定義

## File Scope

- 作成: `package-templates/package.scripts.fragment.json`
- 変更: なし
- 削除: なし

**変更禁止**: 本リポの `package.json`（存在しない）/ TASK-0011, TASK-0012 の対象ファイル / SAGE 内部物

## 禁止事項

PLAN-0003 §Forbidden Shortcuts 継承。本 TASK 固有:
- JSON コメント追加（`//` は JSON 標準外）
- `pnpm` 以外を固定（コマンド内の PM 指定は許容、利用者カスタマイズ前提）
- 個別ツール（react-doctor, knip 等）の特定バージョン埋め込み
- secret 直書き
- gakuten 固有語

## 完了条件

- [ ] AC: `ls package-templates/package.scripts.fragment.json` 成功
- [ ] AC: JSON 構文 pass
- [ ] AC: `python3 -c "import json,sys; d=json.load(open('package-templates/package.scripts.fragment.json')); assert 'scripts' in d; assert 'ai:check' in d['scripts']; assert 'ai:check:fast' in d['scripts']"` 成功
- [ ] AC: secret 不在
- [ ] AC: gakuten 固有語不在
- [ ] AC: ファイル行数 5-30

## Done Definition

SPEC-0003 AC-01（部分）, AC-03, AC-07, AC-12, AC-14 のうち package.scripts.fragment.json 部分。

## SPEC/PLAN 継承事項

| 項目 | 参照先 | 概要 |
|---|---|---|
| Quality Gate | PLAN-0003 §Quality Gate | Gate 1 / 2 / 3 |
| テスト種別 | PLAN-0003 §必要な検証 | structural + syntax + security |
| カバレッジ | SPEC-0003 §NFR-05 | N/A |
| commit-msg hook | SPEC-0003 §契約 | 各 commit に TASK-0013 |
| Error Resolution | SPEC-0003 §Error Resolution | AC 別 |
| failures.md / anti-patterns.md | PLAN-0003 §Knowledge Management | 個別ツール固定パターン蓄積で昇格 |
| 採用メトリクス | PLAN-0003 §採用メトリクス | TASK 完了 + AC pass |
| 段階移行 | PLAN-0003 §段階移行 | Pending → Done |
| ロールバック | PLAN-0003 §ロールバック | Level 1: 該当ファイル復元 |

## 実行ログ

| フィールド | 内容 |
|---|---|
| RUN-ID | （実行時） |
| 開始 | （TBD） |
| 完了 | （TBD） |
| 結果 | （TBD） |
| Gate結果 | structural / functional / security / architecture: TBD |
