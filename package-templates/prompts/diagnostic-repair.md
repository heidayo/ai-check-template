# diagnostic-repair プロンプト

> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## 目的

`ai:check`、typecheck、lint、unit test、integration test、E2E smoke、security diagnostic が失敗した後に、AI へ安全に修復を依頼するためのプロンプト雛形。

このプロンプトは「失敗したから成功基準を変える」ことを禁止し、diagnostic output から root cause、repair plan、patch、re-check へ進ませる。Formal Name Match の Repair → Re-check phase で使う。

## 使うタイミング

- 実装後に `pnpm ai:check` または `pnpm ai:check:fast` が失敗した
- CI の diagnostic output を人間が読める形で AI に渡したい
- AI が「修正しました」と言う前に再検証コマンドを固定したい
- 失敗ログに private value が含まれる可能性があり、redacted output だけを渡したい

## プロンプト本文

```
以下の diagnostic output をもとに、実装を修復してください。

## Diagnostic Output

（ここに redacted 済みの失敗ログを貼り付ける）

Rules for this section:
- private value, credential, personal data, token-like value は貼らない
- 必要な場合は [REDACTED] に置換する
- コマンド名、失敗したファイルパス、テスト名、error message、stack trace の relevant excerpt は残す

## Original Requirement

（実装前に固定した要件を貼り付ける）

## Acceptance Criteria

（実装前に固定した AC を貼り付ける）

## Verification Commands

（再実行すべきコマンドを貼り付ける）

## Do Not Change Acceptance Criteria

- Acceptance Criteria は変更しない
- 失敗を避けるために test を弱めない
- 失敗を避けるために assertion を削らない
- 仕様が本当に間違っている可能性がある場合は、コード変更を止めて「SPEC mismatch」として報告する

## Repair Plan

まず patch する前に、以下を短く出力してください。

1. Failing command
2. Failing evidence
3. Suspected root cause
4. Files likely to change
5. Tests that must remain strict
6. Re-check commands

## Patch Rules

- 変更は root cause に直接関係する最小範囲に限定する
- 既存の passing behavior を広げて壊さない
- AC を満たすための test は削除・緩和しない
- redacted diagnostic output から secret value を復元しようとしない
- 関係ない formatting / refactor は混ぜない
- 修復後、変更したファイルと理由を報告する

## Re-check Commands

修復後に以下の順で実行し、結果を報告してください。

```bash
（fast command。例: pnpm test path/to/failing.test.ts）
（typecheck / lint。例: pnpm typecheck）
（full gate。例: pnpm ai:check）
```

## Output Format

### Diagnosis

- Failing command:
- Failing evidence:
- Root cause:

### Repair Plan

- File scope:
- Patch summary:
- Tests preserved:

### Changes Made

- path/to/file:

### Re-check Result

- command:
- result:
- remaining failure:

### Human Review Notes

- risk:
- follow-up:
```

## 期待する AI のふるまい

- diagnostic output を証拠として扱う
- 失敗した command と test name を明記する
- AC を変えずに、実装または test の明確な不整合だけを直す
- 修復後に同じ command を再実行する
- まだ失敗が残る場合は、成功したように報告しない

## 悪い使い方

- 失敗ログを貼らずに「直して」と依頼する
- 失敗を避けるために assertion を削る
- AC を実装後に書き換える
- private value を含む raw diagnostic output を貼る
- unrelated cleanup を同じ repair に混ぜる

## Test Design Template との接続

実装前に [`../docs/test-design-template.md`](../docs/test-design-template.md) で Requirement / AC / Test Matrix / Verification Commands を固定する。実装後に diagnostic が失敗したら、この prompt に同じ AC と redacted diagnostic output を渡す。

## 隣接する思想

- [`../docs/philosophy/formal-name-match.md`](../docs/philosophy/formal-name-match.md) — 名（AC）を変えずに形（実測）を修復する
- [`../docs/philosophy/test-pyramid.md`](../docs/philosophy/test-pyramid.md) — 失敗した layer に応じて最小修復する
- [`../docs/philosophy/given-when-then.md`](../docs/philosophy/given-when-then.md) — 失敗した Then を明確化する
- [`../docs/philosophy/qa-techniques.md`](../docs/philosophy/qa-techniques.md) — 境界値・状態遷移・条件組み合わせの見落としを補う

## 他プロンプトとの組み合わせ

1. [`./plan-first.md`](./plan-first.md) で成功基準を固定
2. [`../docs/test-design-template.md`](../docs/test-design-template.md) で test matrix を作る
3. `ai:check` または CI で diagnostic output を得る
4. `diagnostic-repair.md` で root cause repair を依頼
5. 同じ command を re-check する

## 出典

- Notion ページ: `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー
- philosophy: `package-templates/docs/philosophy/formal-name-match.md` §形名照合ループ
