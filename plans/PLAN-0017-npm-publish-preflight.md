# PLAN-0017: npm publish preflight plan

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0017 |
| SPEC-ID   | SPEC-0017 |
| ステータス | Completed |
| 作成日    | 2026-05-14 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [x] domain
- [x] infrastructure
- [ ] frontend
- [x] infra
- [x] test
- [x] documentation

## 影響範囲

| 対象 | 影響 |
|---|---|
| `Makefile` | publish dry-run preflight target を追加 |
| `package.json` | npm-normalized `bin` path に更新 |
| README / README-ja / `docs/cli.md` / roadmap | `--tag next` preflight と actual publish 未実行を明記 |

## 実装方針

### 採用案

1. `validate-npm-publish-dry-run` target を `make validate` に追加する
2. command は `npm publish --dry-run --tag next --json` に固定する
3. `package.json` の `bin` path は npm publish dry-run が auto-correct しない form にする
4. docs は dry-run / actual publish / auth setup を分離して説明する

### 不採用案

- actual `npm publish`: explicit human approval が必要
- `npm whoami` validation: auth out-of-scope なので CI に要求しない
- package metadata の大幅変更: SPEC-0016 で完了済み。ここでは npm-normalized `bin` path のみ扱う

## Codified Rules

- Standard lane として SPEC-0017 / PLAN-0017 / TASK-0065..0067 に従う
- File Scope は各 TASK の `File Scope（変更許可範囲）` を source of truth にする
- `package-templates/**`, `CLAUDE.md`, `.claude/**`, `sage/**`, `.sage/**`, `templates/**` は変更しない
- commit message には `TASK-0065`..`TASK-0067` を含める
- `make validate`, `npm publish --dry-run --tag next --json`, `bash scripts/sage-validate.sh` を Gate として使う
- `--no-verify`, `--force`, `rm -rf`, actual npm publish, auth token 直書きを禁止する

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0065 | publish dry-run validation and bin path normalization | Implementation / Test | 25m | none | Yes |
| TASK-0066 | publish preflight docs | Documentation | 25m | TASK-0065 | No |
| TASK-0067 | final verification, scoring, commit, PR | Review / Release | 30m | TASK-0065, TASK-0066 | No |

## 依存グラフ

```
TASK-0065 → TASK-0066 → TASK-0067
```

## リスク

- リスク1: dry-run を publish 完了と誤読 → docs と roadmap で actual publish 未完了を明記
- リスク2: `--tag next` を忘れる → Makefile validation に固定
- リスク3: auth を CI に要求してしまう → `npm whoami` は validation に含めない

## 必要な検証

- [x] structural: Makefile target, docs command, roadmap distinction
- [x] syntax: `git diff --check`
- [x] integration: `npm publish --dry-run --tag next --json`
- [x] security: secret grep, no actual publish, protected file check
- [x] architecture: File Scope check, `package-templates/**` unchanged

## Quality Gate マッピング

SPEC-0017 を継承。

## Error Resolution

SPEC-0017 を継承。

## Knowledge Management

SPEC-0017 を継承。Prerelease tag omission が再発した場合は maintainer が npm version, command, expected, actual output を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Active → Implementation | PLAN-0017 と TASK-0065..0067 が各 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| Implementation → Review | AC-01..AC-05 pass | `make validate` + `npm publish --dry-run --tag next --json` |
| Review → PR | AC-01..AC-08 pass and final scoring 100/S++ | `make validate` + `bash scripts/sage-validate.sh` + File Scope checks |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| publish dry-run | `npm publish --dry-run --tag next --json` pass |
| docs clarity | actual publish 未実行が明記される |
| safety | no auth, no publish, no protected file changes |

## 関連ID

- SPEC: SPEC-0017
- TASK: TASK-0065, TASK-0066, TASK-0067
