# SPEC-0011: Next.js basic Before / After example

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0011 |
| ステータス | Implemented |
| 作成日    | 2026-05-14 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0001, SPEC-0003, SPEC-0005, SPEC-0010 |
| 権限レベル | platform |

## 背景・目的

v0.1.0 のテンプレート群は philosophy / prompts / scripts / CI / profiles まで揃っているが、外部利用者が「実際に AI 生成コードをどう検証して修正するのか」を短時間で追える具体例がまだない。

本 SPEC では `examples/nextjs-basic/` に小さな Next.js App Router example を追加する。AI が作りがちな不十分な `/api/users/[id]` 実装を Before として示し、Formal Name Match / acceptance criteria / tests / `ai:check` によって After に修正される流れを、runnable な example と docs で示す。

## 対象ユーザー

- `ai-check-template` を初めて見る外部開発者
- Next.js App Router + TypeScript のプロジェクトで AI-assisted development を導入したい利用者
- README だけではなく、Before / After の具体例で導入判断したい reviewer

## スコープ（含む）

- `examples/nextjs-basic/` に runnable な minimal Next.js example を追加する
- `examples/nextjs-basic/README.md` に目的、実行手順、Before / After、検証コマンドを記載する
- `examples/nextjs-basic/docs/before.md` に問題のある AI 生成例と失敗理由を記載する
- `examples/nextjs-basic/docs/after.md` に修正後の設計、AC、テスト対応を記載する
- `examples/nextjs-basic/app/` に after state の App Router page / API route を追加する
- `examples/nextjs-basic/lib/` にユーザー取得ロジックと testable contract を追加する
- `examples/nextjs-basic/tests/` に Vitest unit tests を追加する
- `README.md`, `README-ja.md`, `docs/roadmap.md` に example への導線を追加する
- `Makefile` の `make validate` に example package JSON と example TypeScript syntax を壊さない範囲の構造検証を追加する

## スコープ外（明示的に除外）

- Playwright / browser E2E の実装
- 実 DB / Supabase / RLS 連携
- npm package 化、CLI、scaffolding
- external API 呼び出し
- Next.js project の production deployment
- example の dependency install を root CI で必須にすること
- `package-templates/scripts/ai-check*.sh` の挙動変更
- `CLAUDE.md`, `.sage/**`, `sage/**`, `templates/**` の変更

## File Scope

**書き込み許可:**
- `examples/nextjs-basic/README.md`（新規）
- `examples/nextjs-basic/.gitignore`（新規）
- `examples/nextjs-basic/package.json`（新規）
- `examples/nextjs-basic/tsconfig.json`（新規）
- `examples/nextjs-basic/next.config.mjs`（新規）
- `examples/nextjs-basic/vitest.config.ts`（新規）
- `examples/nextjs-basic/app/page.tsx`（新規）
- `examples/nextjs-basic/app/users/[id]/page.tsx`（新規）
- `examples/nextjs-basic/app/api/users/[id]/route.ts`（新規）
- `examples/nextjs-basic/lib/users.ts`（新規）
- `examples/nextjs-basic/tests/users.test.ts`（新規）
- `examples/nextjs-basic/docs/before.md`（新規）
- `examples/nextjs-basic/docs/after.md`（新規）
- `README.md`（更新）
- `README-ja.md`（更新）
- `docs/roadmap.md`（更新）
- `Makefile`（更新）
- `specs/SPEC-0011-nextjs-basic-example.md`（新規）
- `plans/PLAN-0011-nextjs-basic-example.md`（新規）
- `tasks/TASK-0038-nextjs-example-scaffold.md`（新規）
- `tasks/TASK-0039-nextjs-example-behavior.md`（新規）
- `tasks/TASK-0040-nextjs-example-docs.md`（新規）
- `tasks/TASK-0041-nextjs-example-validation.md`（新規）
- `tasks/TASK-0042-verify-nextjs-basic-example.md`（新規）

**変更禁止:**
- `package-templates/scripts/**`
- `package-templates/package.scripts.fragment.json`
- `package-templates/docs/philosophy/**`
- `.github/workflows/**`
- `CLAUDE.md`
- `.sage/**`, `sage/**`, `templates/**`
- 既存 `specs/SPEC-000*.md`, `plans/PLAN-000*.md`, `tasks/TASK-000*.md`

## CLAUDE.md / .claude/rules 連携

本 SPEC では `CLAUDE.md` / `.claude/rules/**` への追記は行わない。実装エージェントは既存の SAGE lifecycle / File Scope / Forbidden Shortcuts を適用し、追加ルールは本 SPEC 内で閉じる。

| ルール | 実装時の遵守事項 |
|---|---|
| SAGE lifecycle | SPEC / PLAN / TASK / 評価後に実装する |
| Frontend empathy | example は landing page ではなく、Before / After と検証の流れをすぐ追える実用画面にする |
| 汎用ファースト | 特定プロジェクト固有名を含めない |
| 配布物との分離 | example は `examples/nextjs-basic/` に置き、`package-templates/` の挙動は変えない |

## Forbidden Shortcuts

- SPEC / PLAN / TASK 採点なしに実装へ進む
- File Scope 外の変更
- `--no-verify`, `--force`, `rm -rf`
- secret / token / API key の直書き
- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等の固有語混入
- Before の問題例に real personal data や実在個人情報を含める
- root CI で example dependency install を必須にする
- example docs に unfinished markers を残す

## 要件

### 機能要件

- [FR-01] `examples/nextjs-basic` が runnable な Next.js App Router example として成立する
- [FR-02] Before doc が AI 生成コードの失敗点を 3 件以上説明する
- [FR-03] After doc が AC と test mapping を説明する
- [FR-04] API route は public user fields のみ返す
- [FR-05] unknown user id は 404 を返す
- [FR-06] invalid user id format は 400 を返す
- [FR-07] unit tests が FR-04..FR-06 を検証する
- [FR-08] root README / README-ja / roadmap から example に到達できる
- [FR-09] `make validate` が example の JSON / TypeScript file presence / package scripts を検証する

### 非機能要件

- [NFR-01] example docs は external user が 10 分以内に読める量にする
- [NFR-02] root CI は dependency install なしで pass する
- [NFR-03] example package scripts は `ai:check` と `ai:check:fast` を含む
- [NFR-04] カバレッジ閾値: N/A。代替指標として FR-04..FR-07 の unit tests と AC-01..AC-13 を coverage gate とする
- [NFR-05] TypeScript は `strict: true`

### セキュリティ要件

- [SEC-01] public API response は `email`, `internalNotes`, `role`, `createdAt` を返さない
- [SEC-02] invalid user id を明示的に reject する
- [SEC-03] docs / code に secret 直書きパターンを含めない
- [SEC-04] example は external network / external API に依存しない

### 運用要件

- [OPS-01] PR #6 では Next.js dependency install を CI 必須にしない
- [OPS-02] example の実行手順は `cd examples/nextjs-basic && pnpm install && pnpm ai:check` として明示する
- [OPS-03] PR CI failure は同一ブランチで修正し、`make validate` と GitHub Actions 再実行結果で feedback loop を閉じる

## Quality Gate マッピング

| Gate | 対応 AC | 検証 |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06 | `test -f`, `grep`, `python3 -m json.tool`, `wc -l` |
| Gate 2: Functional | AC-07, AC-08, AC-09, AC-10 | `make validate`, test script presence, route behavior tests |
| Gate 3: Security | AC-11, AC-12 | secret grep, forbidden field grep / tests |
| Gate 4: Architecture | AC-13 | File Scope / protected files check |
| Gate 5: Release | N/A | v0.1.0 tag は SPEC-0014 |

## 受け入れ条件（Acceptance Criteria）

### 正常系

- [x] AC-01: example 必須 13 ファイルが存在する
- [x] AC-02: `examples/nextjs-basic/package.json` が `dev`, `build`, `typecheck`, `test`, `ai:check`, `ai:check:fast` scripts を持つ
- [x] AC-03: `examples/nextjs-basic/docs/before.md` が失敗点を 3 件以上含む
- [x] AC-04: `examples/nextjs-basic/docs/after.md` が acceptance criteria と test mapping を含む
- [x] AC-05: `examples/nextjs-basic/tsconfig.json` が `"strict": true` を含む
- [x] AC-06: root README / README-ja / docs/roadmap が `examples/nextjs-basic` に言及する

### 機能検証

- [x] AC-07: `make validate` が pass する
- [x] AC-08: `examples/nextjs-basic/tests/users.test.ts` が public fields / 404 / 400 のテストを含む
- [x] AC-09: API route が `getPublicUser` を呼び、404 / 400 を分岐する
- [x] AC-10: `examples/nextjs-basic/package.json` の `ai:check` が `typecheck`, `test`, `build` を含む

### 異常系

- [x] AC-11: secret 直書きパターンがない（`grep -riE --exclude-dir=node_modules --exclude-dir=.next "(api[-_]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*['\"]" examples/nextjs-basic README.md README-ja.md docs/roadmap.md Makefile` が空）
- [x] AC-12: public response に forbidden fields が含まれないことを test が検証する
- [x] AC-13: 変更ファイルが File Scope 内のみで、`package-templates/scripts/` と SAGE protected files に変更がない

## 異常系

- 想定エラー1: example が Next.js project として読めない → package / app / route / config 必須ファイルを AC-01 で検出する
- 想定エラー2: Before doc が単なる説明で検証につながらない → AC-03 / AC-04 で failure point と test mapping を要求する
- 想定エラー3: public API が private fields を返す → AC-08 / AC-12 で unit test により検出する
- 想定エラー4: root CI が dependency install を始めて遅くなる → Makefile は dependency install しない
- 境界ケース1: Next.js major version 更新で example scripts が古くなる → docs に "example dependency versions are illustrative" と明示し、follow-up SPEC で更新する

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | 欠落ファイルを File Scope 内に作成 |
| AC-02 | package scripts を補完 |
| AC-03 | before.md に失敗点を追加 |
| AC-04 | after.md に AC / test mapping を追加 |
| AC-05 | tsconfig の `strict` を有効化 |
| AC-06 | README / README-ja / roadmap にリンク追加 |
| AC-07 | `make validate` の失敗箇所を修正 |
| AC-08 | unit tests に不足 assertion を追加 |
| AC-09 | API route の 400 / 404 分岐を修正 |
| AC-10 | `ai:check` script を修正 |
| AC-11 | generated dependency dirs を除外した上で、該当する secret 直書き表現を削除 |
| AC-12 | forbidden fields assertion を追加 |
| AC-13 | File Scope 外変更を取り除く |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| example が dependency install 後に壊れる | `sage/failures.md` | maintainer |
| Before / After が利用者に伝わらない feedback | `docs/phase-1-feedback-template.md` → follow-up SPEC | maintainer |
| Next.js major update で example が古くなる | `sage/failures.md`、SPEC-0011 follow-up | maintainer |

### failures / anti-patterns 更新フロー

1. 検出: PR CI、manual `pnpm ai:check`、dogfooding feedback のいずれかで失敗を確認する。
2. 記録: maintainer が失敗条件、再現コマンド、復旧手順を `sage/failures.md` に記録する。
3. 昇格: 同種の example drift / docs mismatch / validation gap が 3 回累積した場合、`sage/anti-patterns.md` への昇格候補として記録する。

## 契約

- API: `GET /api/users/[id]` example route
- DB: なし（in-memory fixture）
- イベント: なし
- CLI: `cd examples/nextjs-basic && pnpm ai:check`
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: example dependency versions が時間とともに古くなる → 軽減策: npm current versions を起点にし、follow-up SPEC で定期更新可能にする
- リスク2: runnable example が大きくなりすぎる → 軽減策: DB / E2E / styling framework は除外し、API + page + unit tests に限定する
- リスク3: Before の問題例が security anti-pattern を推奨して見える → 軽減策: before.md は明確に "do not copy" とし、after state を runnable code にする

## 実装メモ

- package versions checked on 2026-05-14 via `npm view`: Next `16.2.6`, React `19.2.6`, TypeScript `6.0.3`, Vitest `4.1.6`
- Before は runnable code に入れず `docs/before.md` の snippet として示す
- After は actual app / lib / tests として実装する
- `make validate` は dependency install せず、JSON parse / file presence / script grep に留める

## Properties

### Invariants

- [INV-01] (Gate 4) example は `examples/nextjs-basic/` に閉じる
- [INV-02] (Gate 3) public API response は forbidden fields を返さない
- [INV-03] (Gate 4) `package-templates/scripts/**` の挙動は本 SPEC では変更しない

### Pre-conditions

- [PRE-01] (Gate 2) example を実行する利用者は `pnpm` と Node.js を持つ
- [PRE-02] (Gate 2) root CI は dependency install なしの structural validation を実行する

### Post-conditions

- [POST-01] (Gate 2) external user は Before / After / tests / `ai:check` の流れを 10 分以内に追える
- [POST-02] (Gate 3) unit tests が public fields / 400 / 404 behavior を検証する

### Assumptions

- [ASM-01] (Gate 横断) Example dependency versions are illustrative and may be refreshed by future SPEC
- [ASM-02] (Gate 横断) Full dependency install is intentionally outside root CI for v0.1.0

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| example completeness | 13 必須ファイル存在 |
| runnable contract | package scripts include `ai:check` / `ai:check:fast` |
| before/after clarity | before failure points + after test mapping が存在 |
| security behavior | forbidden fields / invalid id / unknown id tests が存在 |
| side effects | File Scope 外の変更なし |

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Approved → PLAN Active | SPEC-0011 が 100/S++ | `sage-evaluate` rubric による SPEC 採点 |
| PLAN Active → Implementation | PLAN-0011 と TASK-0038..0042 が各 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| TASK Done → SPEC Implemented | AC-01..AC-13 全 pass | `make validate` + SPEC-0011 AC commands + `git diff --check` |

## Task decomposition preview

| TASK-ID | 責務 | File Scope 概要 | 依存 |
|---|---|---|---|
| TASK-0038 | Next.js example scaffold | `examples/nextjs-basic/package.json`, `.gitignore`, config files, base app page | none |
| TASK-0039 | user behavior and tests | `app/api/users/[id]/route.ts`, `app/users/[id]/page.tsx`, `lib/users.ts`, `tests/users.test.ts` | TASK-0038 |
| TASK-0040 | Before / After docs | `examples/nextjs-basic/README.md`, `docs/before.md`, `docs/after.md` | TASK-0039 |
| TASK-0041 | repository docs and validation | `README.md`, `README-ja.md`, `docs/roadmap.md`, `Makefile` | TASK-0040 |
| TASK-0042 | verification and closure | SPEC / PLAN / TASK status + AC verification | TASK-0038..0041 |

Dependency graph:

```
TASK-0038 → TASK-0039 → TASK-0040 → TASK-0041 → TASK-0042
```

## ロールバック

Level 1 rollback は、この SPEC の File Scope に含まれる追加 example と docs 更新を revert する。`package-templates/scripts/**` と SAGE protected files は変更しないため、配布済みテンプレートの runtime behavior には影響しない。

## 関連ID

- PLAN-ID: PLAN-0011
- TASK-ID: TASK-0038, TASK-0039, TASK-0040, TASK-0041, TASK-0042
