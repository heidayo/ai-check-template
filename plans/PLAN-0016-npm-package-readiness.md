# PLAN-0016: npm package readiness plan

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0016 |
| SPEC-ID   | SPEC-0016 |
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
| `package.json` | npm package metadata を補強 |
| `tests/cli/package.test.mjs` | pack contents / installed binary smoke を追加 |
| `Makefile` | package readiness validation を追加 |
| README / README-ja / `docs/cli.md` / roadmap | publish-not-yet と local tarball readiness を明記 |

## 実装方針

### 採用案

1. package metadata を npm public package として不足ない形にする
2. `files` whitelist は維持し、tarball に runtime files だけが入ることを test で固定する
3. `npm pack` の generated tarball は temp directory に置く
4. tarball を temp prefix に install して `.bin/ai-check-template` を black-box smoke する
5. `make validate` は `npm pack --dry-run --json` と CLI tests を通す

### 不採用案

- `npm publish`: release operation と認証が絡むため follow-up SPEC
- package manager matrix: v0.2.0 readiness では npm package 自体に集中する
- tarball snapshot commit: generated artifact は commit しない

## Codified Rules

- Standard lane として SPEC-0016 / PLAN-0016 / TASK-0061..0064 に従う
- File Scope は各 TASK の `File Scope（変更許可範囲）` を source of truth にする
- `CLAUDE.md` / `.claude/**` / `sage/**` / `.sage/**` / `templates/**` / `package-templates/**` は変更しない
- commit message には `TASK-0061`..`TASK-0064` を含める
- `make validate`, `node --test tests/cli/*.test.mjs`, `bash scripts/sage-validate.sh` を Gate として使う
- `--no-verify`, `--force`, `rm -rf`, npm publish, auth token 直書きを禁止する

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0061 | npm package metadata 補強 | Implementation | 25m | none | Yes |
| TASK-0062 | npm pack / local tarball smoke tests | Implementation / Test | 45m | TASK-0061 | No |
| TASK-0063 | docs and validation wiring | Implementation / Test | 35m | TASK-0061, TASK-0062 | No |
| TASK-0064 | final verification, scoring, commit, PR | Review / Release | 30m | TASK-0061..0063 | No |

## 依存グラフ

```
TASK-0061 → TASK-0062 → TASK-0063 → TASK-0064
```

## リスク

- リスク1: tarball contents が広がる → `files` whitelist と exclusion tests
- リスク2: npm publish 済みと誤読される → docs に publish-not-yet を明記
- リスク3: npm smoke が CI で不安定 → no dependency install と temp directory fixture に限定

## 必要な検証

- [x] structural: package metadata, docs links, Makefile target
- [x] syntax: `python3 -m json.tool package.json`, `git diff --check`
- [x] unit: tarball contents assertion
- [x] integration: local tarball install and binary smoke
- [x] security: secret grep, tarball exclusion assertion, no publish command
- [x] architecture: File Scope check, protected file check, `package-templates/**` unchanged

## Quality Gate マッピング

SPEC-0016 を継承。

## Error Resolution

SPEC-0016 を継承。

## Knowledge Management

SPEC-0016 を継承。Package readiness failure が再発した場合は maintainer が npm version, command, expected/actual tarball contents, error output を `sage/failures.md` に記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Active → Implementation | PLAN-0016 と TASK-0061..0064 が各 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| Implementation → Review | AC-01..AC-07 pass | `node --test tests/cli/*.test.mjs` + `npm pack --dry-run --json` |
| Review → PR | AC-01..AC-09 pass and final scoring 100/S++ | `make validate` + `bash scripts/sage-validate.sh` + File Scope checks |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| metadata readiness | package metadata fields present |
| tarball contents | expected runtime files included and SAGE/test files excluded |
| installed binary | local tarball-installed `--help` and `init` pass |
| validation | `make validate` pass |

## 関連ID

- SPEC: SPEC-0016
- TASK: TASK-0061, TASK-0062, TASK-0063, TASK-0064
