# PLAN-0018: CLI doctor foundation plan

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0018 |
| SPEC-ID   | SPEC-0018 |
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
| `src/cli/doctor.mjs` | read-only health check command を追加 |
| `src/cli/index.mjs` | top-level dispatch / help に doctor を追加 |
| `tests/cli/doctor.test.mjs` | doctor behavior tests を追加 |
| `tests/cli/package.test.mjs` | tarball contents に doctor module を追加 |
| `Makefile` | structural validation に doctor files / docs を追加 |
| README / README-ja / `docs/cli.md` / roadmap | doctor foundation の導線を追加 |

## 実装方針

### 採用案

1. doctor は `init` と同じ expected templates を read-only source として使う
2. checks は exact match が妥当な template-managed files と package scripts に限定する
3. text output と `--json` output を提供し、issues は `code` / `path` / `message` で返す
4. non-zero exit は missing / drift / invalid target のみ
5. tests は init で healthy fixture を作ってから doctor を black-box 実行する

### 不採用案

- auto repair: future `update` command に分離
- profile-specific deep validation: profile semantics が固まってから拡張
- external network / npm registry checks: doctor foundation は local filesystem only

## Codified Rules

- Standard lane として SPEC-0018 / PLAN-0018 / TASK-0068..0071 に従う
- File Scope は各 TASK の `File Scope（変更許可範囲）` を source of truth にする
- `package.json`, `package-templates/**`, `CLAUDE.md`, `.claude/**`, `sage/**`, `.sage/**`, `templates/**` は変更しない
- commit message には `TASK-0068`..`TASK-0071` を含める
- `make validate`, `node --test tests/cli/*.test.mjs`, `bash scripts/sage-validate.sh` を Gate として使う
- `--no-verify`, `--force`, `rm -rf`, target write, npm publish を禁止する

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0068 | doctor command implementation | Implementation | 50m | none | Yes |
| TASK-0069 | doctor tests and package test update | Implementation / Test | 45m | TASK-0068 | No |
| TASK-0070 | doctor docs and validation wiring | Documentation / Test | 35m | TASK-0068, TASK-0069 | No |
| TASK-0071 | final verification, scoring, commit, PR | Review / Release | 30m | TASK-0068..0070 | No |

## 依存グラフ

```
TASK-0068 → TASK-0069 → TASK-0070 → TASK-0071
```

## リスク

- リスク1: doctor が read-only を破る → before / after snapshot test
- リスク2: strict drift 判定が false positive になる → template-managed files の exact match に限定
- リスク3: JSON output が壊れる → parse test を追加

## 必要な検証

- [x] structural: doctor module, help, docs, Makefile target
- [x] syntax: `git diff --check`
- [x] unit/integration: doctor healthy / drift / json / read-only tests
- [x] security: secret grep, no target writes
- [x] architecture: File Scope check, protected file check, `package-templates/**` unchanged

## Quality Gate マッピング

SPEC-0018 を継承。

## Error Resolution

SPEC-0018 を継承。

## Knowledge Management

SPEC-0018 を継承。Doctor false positive / drift detection gap が再発した場合は maintainer が command, fixture, expected issue, actual output を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Active → Implementation | PLAN-0018 と TASK-0068..0071 が各 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| Implementation → Review | AC-01..AC-09 pass | `node --test tests/cli/*.test.mjs` |
| Review → PR | AC-01..AC-11 pass and final scoring 100/S++ | `make validate` + `bash scripts/sage-validate.sh` + File Scope checks |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| healthy detection | init fixture doctor pass |
| drift detection | missing / changed files return issues |
| read-only safety | target snapshot unchanged |
| validation | `make validate` pass |

## 関連ID

- SPEC: SPEC-0018
- TASK: TASK-0068, TASK-0069, TASK-0070, TASK-0071
