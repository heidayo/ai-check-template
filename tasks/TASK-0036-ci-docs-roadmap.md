# TASK-0036: CI docs and roadmap updates

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0036 |
| SPEC-ID   | SPEC-0010 |
| PLAN-ID   | PLAN-0010 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0035 |
| 見積     | 45m |

## Goal

追加した reusable workflow examples と本リポ CI の位置付けを docs に反映する。

## Scope

- CI examples README の direct / reusable 説明を更新する
- root README / README-ja の CI templates 行を更新する
- package-templates README の構造図を更新する
- roadmap の SPEC-0009 / SPEC-0010 進捗を更新する

## Non-goals

- npm CLI roadmap の詳細化
- examples/nextjs-basic の記述追加
- Release notes 作成

## File Scope（変更許可範囲）

- 変更: `package-templates/ci-examples/README.md`
- 変更: `package-templates/README.md`
- 変更: `README.md`
- 変更: `README-ja.md`
- 変更: `docs/roadmap.md`
- 作成/削除: なし

## 禁止事項

- 配布物 script の説明を実装変更したように書かない
- v0.1.0 release 済みのように書かない
- 特定プロジェクト固有語を追加しない

## 完了条件

- [x] `package-templates/ci-examples/README.md` が `ai-quality-reusable.yml` と `ai-quality-call.yml` を説明する
- [x] `README.md` と `README-ja.md` が reusable workflow に言及する
- [x] `package-templates/README.md` の構造図に新規 YAML が含まれる
- [x] `docs/roadmap.md` が SPEC-0009 と SPEC-0010 を完了扱いにする

## Tests

- `grep -q "ai-quality-reusable.yml" package-templates/ci-examples/README.md package-templates/README.md`
- `grep -q "reusable workflow" README.md`
- `grep -q "reusable workflow" README-ja.md`

## Done Definition

SPEC-0010 AC-06, AC-09, AC-10。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0010 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: pass / functional: pass / security: pass / architecture: pass |
