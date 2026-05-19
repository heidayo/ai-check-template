# TASK-0180: Formal Name Entrypoint Docs

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0180 |
| SPEC-ID   | SPEC-0047 |
| PLAN-ID   | PLAN-0047 |
| ステータス | Done |
| 担当Agent | Codex Implementation |
| 並列可否  | Yes |
| 依存TASK  | TASK-0179 |
| 見積     | 35m |

## 責務

形名参同の限界と `ai-check*.sh` の責任分界を public template docs に明記する。

## 入力

- SPEC-0047
- PLAN-0047
- `package-templates/docs/philosophy/formal-name-match.md`
- `package-templates/scripts/README.md`
- `package-templates/scripts/ai-check*.sh`

## 出力

- `formal-name-match.md` に「防げること / 防げないこと / 補完策」が追記される
- script docs が `ai-check*.sh` は薄い entrypoint で npm scripts / profile resolver に委譲する設計だと説明する
- 必要最小限の場合のみ shell comments が更新される

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `package-templates/docs/philosophy/formal-name-match.md`
- 変更: `package-templates/scripts/README.md`
- 変更: `package-templates/scripts/ai-check.sh`
- 変更: `package-templates/scripts/ai-check-fast.sh`
- 変更: `package-templates/scripts/ai-check-secure.sh`
- 削除: なし

## 禁止事項

- README / docs/cli / docs/roadmap を変更しない
- CLI source / tests を変更しない
- shell script の実行 behavior を必要なく変更しない
- Claude Code 固有ファイルを変更しない

## 完了条件

- [x] `formal-name-match.md` が semantic correctness / test coverage / human review の限界を明記している
- [x] `package-templates/scripts/README.md` が shell entrypoint と npm scripts / profile resolver の責任分界を説明している
- [x] `bash -n package-templates/scripts/ai-check.sh package-templates/scripts/ai-check-fast.sh package-templates/scripts/ai-check-secure.sh` が pass する
- [x] `make validate-structure` が pass する
- [x] `git diff --check` が pass する

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0047-round-1.md`（今回の小規模変更では TASK 完了条件と SPEC AC を Done Definition として扱う）

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | 2026-05-19-spec-0047-task-0180 |
| 開始     | 2026-05-19 |
| 完了     | 2026-05-19 |
| 結果     | PASS |
| Gate結果  | structural: pass / functional: pass / security: pass |

## 自動採点

```yaml
eval_feedback:
  target_file: "tasks/TASK-0180-formal-name-entrypoint-docs.md"
  target_type: TASK
  verdict: PASS
  total_score: 100
  grade: "S++"
  subscores:
    codified_rules: "20/20"
    atomic_decomposition: "20/20"
    spec_driven_development: "20/20"
    observable_development: "20/20"
    knowledge_management: "15/15"
    gradual_adoption: "5/5"
  findings: []
  fix_instructions: []
```
