# PLAN-0011: Next.js basic example implementation plan

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0011 |
| SPEC-ID   | SPEC-0011 |
| ステータス | Completed |
| 作成日    | 2026-05-14 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] frontend
- [x] usecase
- [x] infrastructure
- [x] test
- [x] documentation

## 影響範囲

| 対象 | 影響 |
|---|---|
| `examples/nextjs-basic/` | runnable Next.js App Router example を追加 |
| `README.md` / `README-ja.md` | examples 導線を追加 |
| `docs/roadmap.md` | SPEC-0011 の進捗を反映 |
| `Makefile` | root validation に example structural checks を追加 |
| `package-templates/**` | 変更なし |

## 実装方針

### 採用案

1. Before は runnable code ではなく `docs/before.md` の snippet として示す
2. After は actual Next.js app / API route / lib / Vitest tests として実装する
3. Root `make validate` は dependency install せず、example の JSON / file presence / script grep を検証する
4. Example 自体は `cd examples/nextjs-basic && pnpm install && pnpm ai:check` で利用者が実行できる形にする

### 不採用案

- `before/` と `after/` に 2 つの Next.js app を置く: files と maintenance cost が過剰
- Playwright E2E を含める: v0.1.0 example として重すぎる
- Supabase / DB を含める: SPEC-0011 の "basic" 範囲を超える
- Root CI で example dependencies を install する: PR CI が重くなり v0.1.0 の運用に合わない

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0038 | Next.js example scaffold | Implementation | 45m | none | Yes |
| TASK-0039 | User behavior, API route, tests | Implementation / Test | 60m | TASK-0038 | No |
| TASK-0040 | Before / After docs | Implementation | 45m | TASK-0039 | No |
| TASK-0041 | Repository docs and validation | Implementation | 40m | TASK-0040 | No |
| TASK-0042 | AC verification and scoring closure | Test / Review | 30m | TASK-0038..0041 | No |

## 依存グラフ

```
TASK-0038 → TASK-0039 → TASK-0040 → TASK-0041 → TASK-0042
```

## リスク

- リスク1: example dependency versions が古くなる → package versions は SPEC に記録し、future SPEC で更新可能にする
- リスク2: docs と runnable after code が乖離する → TASK-0040 完了条件に after doc / tests mapping を置く
- リスク3: root validation が example runtime verification と誤解される → README に root `make validate` と example `pnpm ai:check` の違いを明記する

## 必要な検証

- [x] structural: required files, README links, package scripts
- [x] syntax: `python3 -m json.tool`, root `make validate`, `git diff --check`
- [x] unit: `examples/nextjs-basic/tests/users.test.ts` defines public fields / 400 / 404 assertions
- [x] security: forbidden field tests, secret pattern grep
- [x] architecture: File Scope check, protected file check
- [x] e2e: N/A（SPEC-0011 scope 外）

## Quality Gate マッピング

SPEC-0011 を継承。

## Error Resolution

SPEC-0011 を継承。

## Knowledge Management

SPEC-0011 を継承。

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Active → Implementation | PLAN-0011 と TASK-0038..0042 が各 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| TASK chain → Verification | TASK-0038..0041 Done | `rg -n 'ステータス \\| Pending|ステータス \\| In Progress' tasks/TASK-0038-nextjs-example-scaffold.md tasks/TASK-0039-nextjs-example-behavior.md tasks/TASK-0040-nextjs-example-docs.md tasks/TASK-0041-nextjs-example-validation.md` が空 |
| SPEC Implemented | AC-01..AC-13 全 pass | `make validate` + SPEC-0011 AC commands + `git diff --check` |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| TASK completion | TASK-0038..0042 Done |
| example completeness | SPEC-0011 AC-01 pass |
| behavior coverage | public fields / 400 / 404 tests present |
| docs clarity | before failure points + after test mapping present |
| side effects | File Scope 外変更なし |

## 関連ID

- SPEC: SPEC-0011
- TASK: TASK-0038, TASK-0039, TASK-0040, TASK-0041, TASK-0042
