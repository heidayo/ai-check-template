# TASK-0032: CONTRIBUTING + CODE_OF_CONDUCT + SECURITY 作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0032 |
| SPEC-ID | SPEC-0009 |
| PLAN-ID | PLAN-0009 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 60m |

## 責務

ルートに `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md` / `SECURITY.md` を新規作成。全て英語。

## 入力

- SPEC-0009 §実装メモ
- Contributor Covenant v2.1 公式英語テキスト（CODE_OF_CONDUCT.md の標準）
- 本リポの SAGE 規律（CONTRIBUTING.md で SAGE への薄い参照）

## 出力

### `CONTRIBUTING.md`（英語、80-300 行）
- Welcome / Code of Conduct への参照
- Quick start for contributors（環境セットアップ）
- Lanes overview（vibe / lite / standard / promotion の使い分け概要）
- PR flow（branch 命名 / commit message に TASK-ID / PR template）
- Local validation（`bash scripts/sage-validate.sh`、本リポは Phase 2 まで Node 環境不要）
- Where to start（good first issue label / Issue へのリンク）
- License agreement（Apache-2.0、貢献者は同意とみなす）

### `CODE_OF_CONDUCT.md`（英語、60-200 行）
- Contributor Covenant v2.1 公式テキストベース
- Enforcement contact（GitHub Security Advisories or maintainer GitHub handle）

### `SECURITY.md`（英語、30-100 行）
- Supported versions
- Reporting a Vulnerability（GitHub Security Advisories を Primary、Severity Slack 等は本リポでは不要）
- Response SLO（acknowledgment 内に response、評価期間、修正リリース）
- Out of scope（外部依存パッケージ自体の脆弱性は本リポ scope 外、各依存先で報告）

## File Scope

- 作成: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`
- 変更/削除: なし

**変更禁止**: TASK-0029, TASK-0030, TASK-0031 の対象、SAGE 内部物、配布物

## 禁止事項

PLAN-0009 §Forbidden Shortcuts 継承 + 固有:
- 個人 email の直書き（GitHub Security Advisories Primary）
- gakuten 等固有語
- SAGE 規律の詳細をコピペで CONTRIBUTING に貼る（リンクで誘導）
- Contributor Covenant の改変（公式テキスト準拠）

## 完了条件

- [x] 3 ファイル全存在
- [x] CONTRIBUTING.md が PR template / SAGE / TASK-ID への言及（`grep -qE "PULL_REQUEST_TEMPLATE|SAGE|TASK-ID" CONTRIBUTING.md`）
- [x] CODE_OF_CONDUCT.md に「Contributor Covenant」言及（`grep -q "Contributor Covenant" CODE_OF_CONDUCT.md`）
- [x] SECURITY.md に脆弱性報告手段（`grep -qE "Security Advisor|vulnerability|report" SECURITY.md`）
- [x] gakuten 固有語不在
- [x] 個人 email 直書きなし（`grep -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md` の出力が空 or `noreply@` のみ）

## Done Definition
SPEC-0009 AC-01（部分）, AC-08, AC-09, AC-11, AC-12, AC-13。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0009（Gate 1/2/3/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0032 |
| Error Resolution | SPEC-0009 |
| failures/anti-patterns | PLAN-0009 |
| 採用メトリクス | PLAN-0009 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1 |

## 実行ログ
| RUN-ID | 2026-05-14-spec-0009 |
| 開始 / 完了 / 結果 / Gate | 2026-05-14 / 2026-05-14 / PASS / Gate 1,2,3,4 |
