# SPEC-0049: ai-check Structured Run

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0049 |
| ステータス | Done |
| 作成日    | 2026-05-19 |
| 更新日    | 2026-05-19 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0047 |
| 権限レベル | platform |

## 背景・目的

`ai:check` は既存ツールを `&&` で連結する薄い gate として成立しているが、AI agent や CI が後続修復に使える構造化 evidence を得にくい。各 step の PASS / FAIL / SKIPPED、duration、redacted output を機械可読に記録する CLI entrypoint を追加し、既存 `ai:check` を壊さずに検収プロトコルを強化する。

## 対象ユーザー

- AI agent に `ai:check` 失敗の evidence を渡したい利用者
- CI 上で step ごとの失敗点と skipped step を JSON artifact として残したい maintainer
- `diagnostic-repair.md` に redacted diagnostic output を渡す reviewer

## スコープ（含む）

- `ai-check-template run` command を追加する
- target `package.json` の指定 script を読み、`&&` step を順に実行する
- 各 step に `PASS` / `FAIL` / `SKIPPED`、exit code、duration、redacted stdout/stderr を記録する
- `--json` と `--output <file>` を提供する
- 失敗後の未実行 step は `SKIPPED` として記録する
- CLI docs と tests を追加する

## スコープ外（明示的に除外）

- 既存 `init` / `doctor` / `update` の基本 contract 変更
- `package.json` script の自動書き換え
- 並列実行、retry、watch mode
- 外部 secret scanner の実行
- npm package version bump / publish

## 要件

### 機能要件
- [FR-01] `ai-check-template run --target . --script ai:check --json` が JSON result を出力する
- [FR-02] result は top-level status `PASS` / `FAIL`、script name、durationMs、steps を含む
- [FR-03] step は command、status、exitCode、durationMs、stdout、stderr を含む
- [FR-04] 失敗 step 以降の未実行 step は `SKIPPED` になる
- [FR-05] stdout/stderr は token / password / secret 風の値を `[REDACTED]` に置換する

### 非機能要件
- [NFR-01] runtime dependency を追加しない
- [NFR-02] shell command の exit code を正しく反映する
- [NFR-03] 既存 CLI help に `run` を追加する

### セキュリティ要件
- [SEC-01] JSON output に secret-like value をそのまま残さない
- [SEC-02] `--output` は target 外も許可するが、親 directory を作るだけで command string は変更しない

### 運用要件
- [OPS-01] `node --test tests/cli/run.test.mjs` が pass
- [OPS-02] `npm test` が pass
- [OPS-03] `make validate` が pass

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `node bin/ai-check-template.mjs run --target <fixture> --script ai:check --json` が steps 配列を含む JSON を出す
- [x] AC-02: 2 step 目が fail する fixture で top-level status が `FAIL`、3 step 目が `SKIPPED`
- [x] AC-03: output 内の `TOKEN=...` が `[REDACTED]` になる
- [x] AC-04: `--output result.json` で同じ JSON が file に保存される
- [x] AC-05: `npm test` が pass

## 異常系

- script が存在しない場合: non-zero exit で `missing-script` error を返す
- target に `package.json` がない場合: non-zero exit で対象不備を返す
- `--output` の親 directory が存在しない場合: 作成して書き込む

## 契約

- API: なし
- DB: なし
- イベント: なし
- CLI contract: `run --target --script --json --output`

## リスク

- shell split が複雑な command を誤分割する → 初期版は `&&` の明示連結に限定し docs に明記する
- output に秘密情報が残る → default redaction patterns と tests で軽減する

## 実装メモ（Implementation Agent向け）

既存 `src/cli/index.mjs` の dispatcher pattern に従い、`src/cli/run.mjs` を追加する。手動 shell parser は `&&` split のみに留める。tests は fixture project を temp dir に作る既存 style を使う。

## Properties

### Invariants
- [INV-01] (Gate 2) step status は `PASS` / `FAIL` / `SKIPPED` のいずれかだけを取る
- [INV-02] (Gate 3) captured output は redaction 後だけが JSON に入る
- [INV-03] (Gate 4) 既存 `init` / `doctor` / `update` contract は変わらない

### Pre-conditions
- [PRE-01] (Gate 2) target directory に `package.json` が存在する
- [PRE-02] (Gate 2) 指定 script が `package.json.scripts` に存在する

### Post-conditions
- [POST-01] (Gate 2) command result と top-level status が一致する
- [POST-02] (Gate 3) secret-like value は `[REDACTED]` に置換される

### Assumptions
- [ASM-01] (Gate 横断) command chain は `&&` 連結を主対象にする

## 関連ID

- PLAN-ID: PLAN-0049
- TASK-ID: TASK-0186

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0049-ai-check-structured-run.md"
  target_type: SPEC
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
