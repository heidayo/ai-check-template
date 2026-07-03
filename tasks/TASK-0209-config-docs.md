# TASK-0209: docs / README への config ガイド追加

## メタデータ

| フィールド | 内容 |
|-----------|------|
| TASK-ID   | TASK-0209 |
| SPEC-ID   | SPEC-0058 |
| PLAN-ID   | PLAN-0058 |
| ステータス | Pending |
| 担当Agent | Implementation |
| 並列可否  | No |
| 依存TASK  | TASK-0207 |
| 見積     | 1h |

## 責務

`docs/cli.md` / `README.md` / `README-en.md` に `.ai-check.yaml` / `.ai-check.json` の config ガイドを追加する: スキーマ version 1 の明文化（契約）、3 ゲート分のコピペ可能な完成例（リスク1）、YAML サブセットの許容構文と `.ai-check.json` escape hatch（リスク2）、フォールバック規則（FR-03 / FR-05）、SEC-01（command は任意コード実行）/ SEC-02（secret 直書き禁止、env var / secret manager 経由）案内、境界ケース1（全無効はゲート実質無効化、CI 非推奨）の明記、run `--json` の `name` / `source` / `configPath` フィールド説明の更新（SPEC T4）。

## 入力

- SPEC-0058 FR-02〜FR-06、SEC-01 / SEC-02、契約（スキーマ version 1・additive JSON 拡張・version 増分方針）、境界ケース1、リスク1〜3、OPS-01 / OPS-02
- TASK-0207 で確定した run 実装・JSON フィールドの実挙動（docs は実装と一致させる — 実証ファースト）
- 言語規約: `docs/cli.md` は英語（既存に合わせる）、`README.md` は日本語、`README-en.md` は英語。`README-ja.md` は stub のため対象外
- 既存 docs 構造: `docs/cli.md` の run オプション表・JSON フィールド説明（更新箇所 — SPEC「既存実装との衝突点」）

## 出力

- `docs/cli.md`: config セクション（スキーマ・許容 YAML 構文・完成例・フォールバック規則・SEC-01/SEC-02・全無効の非推奨）+ run の JSON フィールド説明更新
- `README.md` / `README-en.md`: config の概要と docs/cli.md への参照（fixed-list を持たせず参照型）

## File Scope（変更許可範囲）

- 作成: なし
- 変更: `docs/cli.md`, `README.md`, `README-en.md`
- 削除: なし

## 禁止事項

- docs への secret 直書き例の掲載禁止（例示は env var 参照形式のみ — SPEC Forbidden Shortcuts、検出: 既存 secret scan（Gate 3）+ レビュー）
- `.ai-check.yaml` / `.ai-check.json` という実ファイルのリポジトリ追加禁止（例示は docs 内コードブロックのみ — SPEC 実装ルール）
- `expect` の docs / 挙動記述の変更禁止（SPEC「既存実装との衝突点」: パーサは意図的に独立）
- src / tests / `package-templates/` への変更禁止（AP-03、本 TASK は docs のみ）
- 実装と一致しないスキーマ・挙動の記載禁止（AP-07 Hallucination Propagation 対策 — TASK-0207 の実装を一次情報源とする）
- TODO/FIXME 残留禁止

## 完了条件

- [ ] 記載内容と実装の不一致を発見した場合、docs を実装に合わせるのではなく原因を確認し、仕様乖離なら SPEC 改訂を起票、想定外エラーは `sage/failures.md` に FAIL-XXXX として記録する（Error Resolution Protocol）

- [ ] `grep -l 'ai-check.yaml' docs/cli.md README.md README-en.md` が 3 ファイル全てにヒットする（SPEC T4 完了条件）
- [ ] `grep -q 'secret' docs/cli.md` がパスする（secret 直書き禁止の記載が存在 — SEC-02）
- [ ] docs/cli.md に SEC-01（コミットされた command がそのまま実行される旨）、YAML サブセット許容構文と `.ai-check.json` 案内、3 ゲート完成例、境界ケース1 の CI 非推奨が記載されている
- [ ] docs/cli.md の run JSON フィールド説明に `name` / `source` / `configPath` が追記されている（OPS-01 / 契約）
- [ ] 既存 secret scan（`bash scripts/sage-validate.sh`）がパスする（Gate 3）
- [ ] `npm pack --dry-run` がパスする（AC-09）
- [ ] commit message に TASK-0209 を含める（commit-msg hook で強制）

## Done Definition（ラウンド単位）

参照: `tasks/done-def-SPEC-0058-round-1.md`

## 実行ログ

| フィールド | 内容 |
|-----------|------|
| RUN-ID    | （実行時に自動採番） |
| 開始     | - |
| 完了     | - |
| 結果     | - |
| Gate結果  | - |
