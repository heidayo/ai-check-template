# SPEC-0013: Initial public dogfooding report

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0013 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0008, SPEC-0010, SPEC-0011, SPEC-0012 |
| 権限レベル | platform |

## 背景・目的

v0.1.0 の残り成果物は、初回 dogfooding report と release である。現時点でこの workspace には外部プロジェクトの実データがないため、外部実績を捏造せず、PR #5..#7 と `examples/nextjs-basic` で実測した初回内部 dogfooding 結果を匿名化して公開する。

本 SPEC の目的は、v0.1.0 template set の実用性・発見された gap・修正済み項目・未達条件を、外部利用者が読める形で明示することである。

## 対象ユーザー

- v0.1.0 を導入するか判断したい外部開発者
- dogfooding protocol の実運用例を確認したい contributor
- SPEC-0014 release notes で dogfooding evidence を参照したい maintainer

## スコープ（含む）

- `docs/phase-1-initial-dogfooding-report.md` を作成する
- report に anonymization, scope, methodology, evidence, findings, limitations, next actions を含める
- report に 3 件以上の匿名化 finding を含める
- report に外部/本番プロジェクトデータではないこと、Phase 2 昇格条件未達であることを明記する
- `README.md`, `README-ja.md`, `docs/roadmap.md`, `docs/phase-1-dogfooding-protocol.md` から report へ導線を追加する
- `Makefile` の structural validation に report の存在と必須セクション検証を追加する

## スコープ外（明示的に除外）

- 実在外部プロジェクト名、業務情報、個人情報の記載
- `sage/failures.md` / `sage/anti-patterns.md` の変更
- `package-templates/**` の runtime behavior 変更
- `.github/workflows/**` の変更
- release tag / GitHub Release 作成（SPEC-0014）
- CLI / npm package 化

## File Scope

**書き込み許可:**
- `docs/phase-1-initial-dogfooding-report.md`（新規）
- `docs/phase-1-dogfooding-protocol.md`（更新）
- `docs/roadmap.md`（更新）
- `README.md`（更新）
- `README-ja.md`（更新）
- `Makefile`（更新）
- `specs/SPEC-0013-initial-dogfooding-report.md`（新規）
- `plans/PLAN-0013-initial-dogfooding-report.md`（新規）
- `tasks/TASK-0048-initial-dogfooding-report.md`（新規）
- `tasks/TASK-0049-dogfooding-report-links.md`（新規）
- `tasks/TASK-0050-dogfooding-report-validation.md`（新規）
- `tasks/TASK-0051-verify-dogfooding-report.md`（新規）

**変更禁止:**
- `sage/**`, `.sage/**`, `templates/**`
- `CLAUDE.md`, `.claude/**`
- `.github/**`
- `package-templates/scripts/**`
- `package-templates/prompts/**`
- `package-templates/docs/test-design-template.md`
- `examples/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では `CLAUDE.md` / `.claude/rules/**` を変更しない。実装エージェントは既存の SAGE lifecycle / File Scope / Forbidden Shortcuts を適用する。

| ルール | 実装時の遵守事項 |
|---|---|
| SAGE lifecycle | SPEC / PLAN / TASK / 採点後に実装する |
| Codex-only boundary | Claude Code-specific files は変更しない |
| Public report safety | 外部/本番プロジェクト実績を捏造しない |
| Anonymization | 実名・固有構造・個人情報を記載しない |

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `--no-verify`, `--force`, `rm -rf`
- 外部/本番プロジェクトで実施したように書く
- 実在プロジェクト名、個人名、private URL、secret を含める
- Phase 2 昇格条件を満たしたように書く
- report に unfinished marker patterns を残す

## 要件

### 機能要件

- [FR-01] 初回 dogfooding report が public Markdown として存在する
- [FR-02] report は anonymization policy と data scope を明示する
- [FR-03] report は PR #5..#7 / example run / validation command の evidence を含む
- [FR-04] report は 3 件以上の finding と status / follow-up を含む
- [FR-05] report は limitation と Phase 2 昇格条件未達を明示する
- [FR-06] README / README-ja / roadmap / protocol から report へ到達できる
- [FR-07] `make validate` が report の必須セクションを検証する

### 非機能要件

- [NFR-01] report は external reader が 10 分以内に読める量にする
- [NFR-02] report は 90-260 行に収める
- [NFR-03] root CI は dependency install なしで pass する
- [NFR-04] カバレッジ閾値: N/A。代替指標として AC-01..AC-13 と mandatory section grep を coverage gate とする

### セキュリティ要件

- [SEC-01] report に secret / token / private URL を含めない
- [SEC-02] report に実在個人情報を含めない
- [SEC-03] project names は `project-template-repo` / `project-nextjs-example` 等の匿名名だけを使う
- [SEC-04] report は external production validation を主張しない

### 運用要件

- [OPS-01] PR #8 では report と docs / validation のみを変更する
- [OPS-02] PR CI failure は同一ブランチで修正し、`make validate` と GitHub Actions 再実行結果で feedback loop を閉じる
- [OPS-03] 外部 dogfooding が完了したら follow-up SPEC で report を改訂する

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03, AC-06, AC-07, AC-13 | `test -f`, `grep`, `wc -l` |
| Gate 2: Functional | AC-04, AC-05 | finding count, limitation grep |
| Gate 3: Security | AC-08, AC-09, AC-10, AC-11 | secret grep, forbidden project term grep |
| Gate 4: Architecture | AC-12 | File Scope / protected file check |
| Gate 5: Release | N/A | release は SPEC-0014 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: `docs/phase-1-initial-dogfooding-report.md` が存在する
- [x] AC-02: report が `Anonymization`, `Scope`, `Methodology`, `Evidence`, `Findings`, `Limitations`, `Next Actions` 見出しを含む
- [x] AC-03: report が `project-template-repo` と `project-nextjs-example` を匿名対象として含む
- [x] AC-04: report に `DF-` finding が 3 件以上ある
- [x] AC-05: report が external production project data ではないことと Phase 2 graduation evidence ではないことを明記する
- [x] AC-06: README / README-ja / roadmap / dogfooding protocol が report にリンクする

### 機能検証

- [x] AC-07: `make validate` が pass する
- [x] AC-08: report に secret 直書きパターンがない
- [x] AC-09: report に project-specific forbidden terms がない
- [x] AC-10: report に private URL pattern がない

### 異常系

- [x] AC-11: report と SPEC-0013 関連文書に unfinished marker patterns がない
- [x] AC-12: 変更ファイルが File Scope 内のみで、SAGE protected files と `package-templates/scripts/**` に変更がない
- [x] AC-13: report が 90-260 行の範囲に収まる

## 異常系

- 想定エラー1: report が外部実プロジェクト実績のように読める → AC-05 で limitation を必須にする
- 想定エラー2: 匿名化が不十分 → AC-08..AC-10 で secret / forbidden term / private URL を検査する
- 想定エラー3: report が README から見つからない → AC-06 で root docs の導線を検証する
- 境界ケース1: report が長すぎる → AC-13 で行数上限を検証する

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | report file を File Scope 内に作成 |
| AC-02 | report の必須見出しを追加 |
| AC-03 | anonymized target labels を追加 |
| AC-04 | finding を 3 件以上に補完 |
| AC-05 | limitation と Phase 2 未達の明記を追加 |
| AC-06 | README / README-ja / roadmap / protocol にリンク追加 |
| AC-07 | `make validate` の失敗箇所を修正 |
| AC-08 | secret 直書き表現を削除 |
| AC-09 | forbidden terms を匿名語に置換 |
| AC-10 | private URL を削除または generic URL に置換 |
| AC-11 | unfinished marker patterns を削除 |
| AC-12 | File Scope 外変更を取り除く |
| AC-13 | report を行数範囲に収める |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| report の finding が再発する | `sage/failures.md` | maintainer |
| 外部 dogfooding が完了した | follow-up SPEC / report revision | maintainer |
| 同種の dogfooding gap が 3 回累積する | `sage/anti-patterns.md` 昇格候補 | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: report の finding が外部 dogfooding または PR CI で再発する。
2. 記録: maintainer が再現条件、影響範囲、redacted evidence、対応方針を `sage/failures.md` に記録する。
3. 昇格: 同種の gap が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI: `make validate`
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: report が実プロジェクト dogfooding 完了と誤読される → 軽減策: limitation を report 冒頭と末尾に明記
- リスク2: anonymization が不十分 → 軽減策: forbidden grep と generic project labels を使う
- リスク3: report が release notes と乖離する → 軽減策: roadmap と README に同じ report link を置く

## 実装メモ

- Public report は English primary とし、README-ja は日本語導線を置く
- 実測 evidence は PR #5..#7、`make validate`、`scripts/sage-validate.sh`、`examples/nextjs-basic` の `pnpm ai:check` に限定する
- 外部/本番 project の dogfooding は未実施として記録する

## Properties

### Invariants

- [INV-01] (Gate 3) report は external production validation を主張しない
- [INV-02] (Gate 3) report は secret / private URL / real project name を含まない
- [INV-03] (Gate 4) `sage/**` と `package-templates/scripts/**` は変更しない

### Pre-conditions

- [PRE-01] (Gate 2) report の evidence は merged PR / local command result に基づく
- [PRE-02] (Gate 3) dogfooding targets は匿名名で表記する

### Post-conditions

- [POST-01] (Gate 1) README / roadmap / protocol から report へ到達できる
- [POST-02] (Gate 2) external reader は v0.1.0 の確認済み範囲と未確認範囲を区別できる
- [POST-03] (Gate 2) SPEC-0014 release notes が report を evidence として参照できる

### Assumptions

- [ASM-01] (Gate 横断) 外部 dogfooding の raw evidence は本 session には存在しない
- [ASM-02] (Gate 横断) v0.1.0 は manual template set release であり Phase 2 graduation ではない

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0013 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0013 と TASK-0048..0051 が 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| SPEC Implemented | AC-01..AC-13 全 pass | `make validate` + AC commands + `git diff --check` |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| report completeness | AC-02 pass |
| finding usefulness | AC-04 pass |
| anonymization safety | AC-08..AC-10 pass |
| discoverability | AC-06 pass |
| side effects | AC-12 pass |

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる report / docs / Makefile / SAGE artifact 追加を revert する。runtime template と CI workflow は変更しないため、既存利用者の `ai:check` 実行動作には影響しない。

## 関連ID

- PLAN-ID: PLAN-0013
- TASK-ID: TASK-0048, TASK-0049, TASK-0050, TASK-0051
