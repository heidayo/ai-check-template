# PLAN-0019: CLI update foundation plan

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0019 |
| SPEC-ID   | SPEC-0019 |
| ステータス | Completed |
| 作成日    | 2026-05-14 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] controller
- [x] usecase
- [x] domain
- [x] infrastructure
- [ ] frontend
- [x] infra
- [x] test
- [x] documentation

## 影響範囲

| 対象 | 影響 |
|---|---|
| `src/cli/update.mjs` | guarded template update command を追加 |
| `src/cli/index.mjs` | top-level dispatch / help に update を追加 |
| `tests/cli/update.test.mjs` | update behavior tests を追加 |
| `tests/cli/package.test.mjs` | tarball contents に update module を追加 |
| `Makefile` | structural validation に update files / docs を追加 |
| README / README-ja / `docs/cli.md` / roadmap | update foundation の導線を追加 |

## 実装方針

### 採用案

1. update は current package templates を known managed paths にだけ書き込む
2. write は `--yes` 必須、`--dry-run` は write adapter を止める
3. output は text と `--json` の両方を提供する
4. tests は init fixture を drift させ、update 後 doctor pass を検証する
5. user-owned files は snapshot test で変更されないことを固定する

### 不採用案

- profile-aware migration: future SPEC に分離
- semantic merge of custom scripts: destructive risk が高いため foundation では扱わない
- package manager rewrite: downstream project policy に依存するため scope 外

## Codified Rules

- Standard lane として SPEC-0019 / PLAN-0019 / TASK-0072..0075 に従う
- File Scope は各 TASK の `File Scope（変更許可範囲）` を source of truth にする
- `package.json`, `package-templates/**`, `CLAUDE.md`, `.claude/**`, `sage/**`, `.sage/**`, `templates/**` は変更しない
- commit message には `TASK-0072`..`TASK-0075` を含める
- `make validate`, `node --test tests/cli/*.test.mjs`, `bash scripts/sage-validate.sh` を Gate として使う
- `--no-verify`, `--force`, `rm -rf`, target write without `--yes`, dry-run write, npm publish を禁止する

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0072 | update command implementation | Implementation | 50m | none | Yes |
| TASK-0073 | update tests and package test update | Implementation / Test | 50m | TASK-0072 | No |
| TASK-0074 | update docs and validation wiring | Documentation / Test | 35m | TASK-0072, TASK-0073 | No |
| TASK-0075 | final verification, scoring, commit, PR | Review / Release | 30m | TASK-0072..0074 | No |

## 依存グラフ

```
TASK-0072 → TASK-0073 → TASK-0074 → TASK-0075
```

## リスク

- リスク1: update が user customization を壊す → known managed paths only, `--yes` guard, dry-run test
- リスク2: update と doctor の expected mapping がずれる → update then doctor pass test
- リスク3: JSON output が automation に使いにくい → stable operation schema test

## 必要な検証

- [x] structural: update module, help, docs, Makefile target
- [x] syntax: `git diff --check`
- [x] unit/integration: update drift / dry-run / yes guard / json / doctor pass tests
- [x] security: secret grep, dry-run no write, known path write set
- [x] architecture: File Scope check, protected file check, `package-templates/**` unchanged

## Quality Gate マッピング

SPEC-0019 を継承。

## Error Resolution

SPEC-0019 を継承。

## Knowledge Management

SPEC-0019 を継承。Update destructive write / dry-run bug が再発した場合は maintainer が command, fixture, expected operation, actual output を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Active → Implementation | PLAN-0019 と TASK-0072..0075 が各 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| Implementation → Review | AC-01..AC-10 pass | `node --test tests/cli/*.test.mjs` |
| Review → PR | AC-01..AC-12 pass and final scoring 100/S++ | `make validate` + `bash scripts/sage-validate.sh` + File Scope checks |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| drift repair | update after drift makes doctor pass |
| dry-run safety | target snapshot unchanged |
| guarded writes | write without `--yes` rejected |
| validation | `make validate` pass |

## 関連ID

- SPEC: SPEC-0019
- TASK: TASK-0072, TASK-0073, TASK-0074, TASK-0075
