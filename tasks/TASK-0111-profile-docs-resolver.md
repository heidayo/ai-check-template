# TASK-0111: Profile docs resolver

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0111 |
| SPEC-ID   | SPEC-0030 |
| PLAN-ID   | PLAN-0030 |
| ステータス | Done |
| 担当Agent | Implementation |
| 並列可否  | Yes |
| 依存TASK  | none |
| 見積     | 35m |

## 責務

selected profile と fixed common docs から safe source/target file plan を返す resolver を実装する。

## 入力

- SPEC-0030 FR-01, FR-02, FR-06
- existing `parseProfiles`
- existing `fromTemplates`

## 出力

- `src/cli/profile-docs.mjs`
- `getProfileDocFiles(profile)` helper

## File Scope（変更許可範囲）

- 作成: `src/cli/profile-docs.mjs`
- 削除: なし

## 禁止事項

- init / update / docs / tests を変更しない
- package templates を変更しない
- path を target input から組み立てない
- copied Markdown の本文変換をしない
- runtime dependencies を追加しない
- `--no-verify`, `--force`, `rm -rf` を使わない

## 完了条件

- [x] common docs mapping が deterministic order で返る
- [x] base profile README mapping が selected profile から返る
- [x] addon profile README mapping が selected profile から返る
- [x] target relative paths が `docs/ai-check-template/` 配下のみ
- [x] TASK-0111 採点が 100/S++

## Tests

- `node --test tests/cli/*.test.mjs`

## Error Resolution

| 失敗 | 復旧手順 |
|---|---|
| missing common doc | common mapping を追加 |
| wrong profile doc | selected profile mapping を修正 |
| unsafe target path | target prefix を `docs/ai-check-template/` に戻す |

## Knowledge Management

profile docs resolver regression が再発した場合、maintainer が profile, expected source/target, actual source/target を `sage/failures.md` に記録する。

## 段階採用

resolver は write せず、init/update integration からのみ使用する。

## Done Definition

SPEC-0030 AC-01, AC-02, AC-06 の resolver path が存在する。

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-14-spec-0030-task-0111 |
| 開始     | 2026-05-14 |
| 完了     | 2026-05-14 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |
