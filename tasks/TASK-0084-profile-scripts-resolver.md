# TASK-0084: Profile scripts resolver

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0084 |
| SPEC-ID   | SPEC-0022 |
| PLAN-ID   | PLAN-0022 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

base profile と addon profile から deterministic package scripts object を返す resolver を追加する。

## 入力

- `src/cli/profile.mjs` read-only
- `package-templates/profiles/**/README.md` read-only
- SPEC-0022 FR-01

## 出力

- `src/cli/profile-scripts.mjs`

## File Scope（変更許可範囲）

- 作成: `src/cli/profile-scripts.mjs`
- 削除: なし

## 禁止事項

- CLI integration files を変更しない
- `package-templates/**` を変更しない
- runtime dependencies を追加しない
- secret / absolute target path / environment values を含めない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] resolver が 4 base profiles を扱う
- [x] resolver が `supabase-rls` addon scripts を追加する
- [x] `node-cli` scripts に `test:e2e:smoke` が含まれない
- [x] TASK-0084 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| base profile missing | base profile map に script config を追加 |
| addon scripts missing | addon merge branch を修正 |
| command duplication | append helper で duplicate command step を避ける |

## Knowledge Management

resolver false mapping が再発した場合、maintainer が profile, expected scripts, actual scripts を `sage/failures.md` に記録する。

## 段階採用

resolver は CLI alpha の package script surface のみに限定し、shell / CI / hook profile migration は follow-up に残す。

## Done Definition

SPEC-0022 AC-02, AC-03 の module path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0022-task-0084 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | Pass |
| Gate結果  | structural: PASS / functional: PASS / security: PASS |
