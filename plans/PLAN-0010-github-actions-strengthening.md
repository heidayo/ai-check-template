# PLAN-0010: GitHub Actions strengthening implementation plan

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0010 |
| SPEC-ID   | SPEC-0010 |
| ステータス | Completed |
| 作成日    | 2026-05-14 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] infra
- [x] test
- [x] documentation

## 影響範囲

| 対象 | 影響 |
|---|---|
| `.github/workflows/validate.yml` | 本リポ PR / main push の構造検証を追加 |
| `Makefile` | maintainer と CI が共通で使う `make validate` を追加 |
| `package-templates/ci-examples/github-actions/` | reusable workflow example と caller example を追加 |
| `package-templates/ci-examples/README.md` | direct / reusable の使い分けを追記 |
| `README.md` / `README-ja.md` / `package-templates/README.md` / `docs/roadmap.md` | 新しい CI examples と進捗を反映 |
| `package-templates/scripts/**` | 変更なし |

## 実装方針

### 採用案

1. 本リポ CI は依存インストール不要にする
2. `Makefile` に validation logic を集約し、GitHub Actions は `make validate` を呼ぶだけにする
3. 利用者向け reusable workflow は `package-templates/ci-examples/github-actions/` に example として置く
4. direct workflow examples は既存の `ai-check.yml` / `ai-check-fast.yml` を維持し、reusable workflow は追加選択肢として説明する

### 不採用案

- 本リポに `package.json` を追加して Node-based lint を導入する: v0.2.0 の CLI 化と責務が混ざるため不採用
- `.github/workflows/ai-quality-reusable.yml` を本リポ実運用 workflow として追加する: 配布用 example と本リポ CI が混ざるため不採用
- Composite Action を作る: v0.3.0+ の scope

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0034 | repo validation workflow | Implementation | 45m | none | Yes |
| TASK-0035 | reusable workflow examples | Implementation | 60m | none | Yes |
| TASK-0036 | CI docs and roadmap updates | Implementation | 45m | TASK-0035 | No |
| TASK-0037 | AC verification and status closure | Test / Review | 30m | TASK-0034..0036 | No |

## 依存グラフ

```
TASK-0034 ─┐
TASK-0035 ─┼─→ TASK-0037
           └─→ TASK-0036 ─┘
```

## リスク

- リスク1: `make validate` が CI runner では通るが contributor 環境で Ruby 不在により失敗する → Ruby 不在時は YAML validation を skip し、CI では Ruby ありで検証する
- リスク2: reusable workflow が direct workflow と役割重複する → README で "direct copy" と "centralized reusable" を比較する
- リスク3: roadmap の進捗表が早すぎる完了表示になる → TASK-0037 の AC pass 後に Done 扱いへ更新する

## 必要な検証

- [x] structural: file existence, required YAML keys, line counts
- [x] syntax: `make validate`, Ruby YAML parse, JSON parse, shell `bash -n`
- [x] security: secret pattern grep, workflow permissions grep
- [x] architecture: File Scope check, protected file check
- [x] unit / integration / e2e: N/A（設定ファイルと docs のため）

## Quality Gate マッピング

SPEC-0010 を継承。

## Error Resolution

SPEC-0010 を継承。

## Knowledge Management

SPEC-0010 を継承。

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Active → Completed | TASK-0034..0037 Done | `rg -n 'ステータス \\| Pending|ステータス \\| Active' tasks/TASK-0034-repo-validation-workflow.md tasks/TASK-0035-reusable-workflow-examples.md tasks/TASK-0036-ci-docs-roadmap.md tasks/TASK-0037-verify-github-actions-strengthening.md plans/PLAN-0010-github-actions-strengthening.md` が空 |
| SPEC-0010 Approved → Implemented | AC-01..AC-13 全 pass | `make validate` + SPEC-0010 AC commands + `git diff --check` |

## 関連ID

- SPEC: SPEC-0010
- TASK: TASK-0034, TASK-0035, TASK-0036, TASK-0037
