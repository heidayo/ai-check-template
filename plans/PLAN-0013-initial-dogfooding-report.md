# PLAN-0013: Initial public dogfooding report plan

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0013 |
| SPEC-ID   | SPEC-0013 |
| ステータス | Completed |
| 作成日    | 2026-05-14 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [ ] controller
- [ ] usecase
- [x] domain
- [ ] infrastructure
- [ ] frontend
- [ ] infra
- [x] test
- [x] documentation

## 影響範囲

| 対象 | 影響 |
|---|---|
| `docs/phase-1-initial-dogfooding-report.md` | 初回公開 dogfooding report を追加 |
| `README.md` / `README-ja.md` | report への導線を追加 |
| `docs/roadmap.md` | SPEC-0013 を完了として反映 |
| `docs/phase-1-dogfooding-protocol.md` | 初回 report への参照を追加 |
| `Makefile` | report structural validation を追加 |
| `sage/**` / `package-templates/scripts/**` | 変更なし |

## 実装方針

### 採用案

1. report は English primary で `docs/phase-1-initial-dogfooding-report.md` に置く
2. 外部プロジェクト実績は主張せず、internal repository / example dogfooding と明記する
3. finding は `DF-001` 形式で匿名化し、status / follow-up を含める
4. `make validate` は dependency install せず、required headings / finding count / line count / links を検証する

### 不採用案

- `sage/failures.md` を公開 report 代わりに変更する: SAGE protected file であり、本 SPEC の公開 docs 目的と違う
- 外部 dogfooding を実施済みとして書く: evidence がなく、OSS trust を損なう
- release note を同時作成する: SPEC-0014 の責務

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0048 | Initial dogfooding report 作成 | Implementation | 45m | none | Yes |
| TASK-0049 | Report links and roadmap 更新 | Implementation | 30m | TASK-0048 | No |
| TASK-0050 | Makefile validation 追加 | Implementation / Test | 25m | TASK-0048, TASK-0049 | No |
| TASK-0051 | AC verification and scoring closure | Test / Review | 30m | TASK-0048..0050 | No |

## 依存グラフ

```
TASK-0048 → TASK-0049 → TASK-0050 → TASK-0051
```

## リスク

- リスク1: report が外部 dogfooding 完了と誤読される → limitation を冒頭・末尾・roadmap に明記する
- リスク2: anonymization が不十分 → forbidden term / private URL / secret pattern grep を必須にする
- リスク3: release notes と重複する → SPEC-0013 は evidence report に限定し、SPEC-0014 が release を担当する

## 必要な検証

- [x] structural: required file, headings, README links, roadmap link
- [x] syntax: Markdown only, `make validate`, `git diff --check`
- [x] unit: N/A（public Markdown report）
- [x] integration: N/A（runtime integration なし）
- [x] security: secret pattern grep, forbidden project term grep, private URL grep
- [x] architecture: File Scope check, protected file check
- [x] e2e: N/A（SPEC-0013 scope 外）

## Quality Gate マッピング

SPEC-0013 を継承。

## Error Resolution

SPEC-0013 を継承。

## Knowledge Management

SPEC-0013 を継承。

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Active → Implementation | PLAN-0013 と TASK-0048..0051 が各 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| TASK chain → Verification | TASK-0048..0050 Done | `rg -n 'ステータス \\| Pending|ステータス \\| In Progress' tasks/TASK-0048-initial-dogfooding-report.md tasks/TASK-0049-dogfooding-report-links.md tasks/TASK-0050-dogfooding-report-validation.md` が空 |
| SPEC Implemented | AC-01..AC-13 全 pass | `make validate` + SPEC-0013 AC commands + `git diff --check` |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| TASK completion | TASK-0048..0051 Done |
| report completeness | required headings present |
| anonymization safety | secret / forbidden / private URL checks pass |
| docs discoverability | README / README-ja / roadmap / protocol links present |
| side effects | File Scope 外変更なし |

## 関連ID

- SPEC: SPEC-0013
- TASK: TASK-0048, TASK-0049, TASK-0050, TASK-0051
