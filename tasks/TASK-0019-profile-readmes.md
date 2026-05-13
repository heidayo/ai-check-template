# TASK-0019: 5 profile README 作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0019 |
| SPEC-ID | SPEC-0005 |
| PLAN-ID | PLAN-0005 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 75m |

## 責務

`package-templates/profiles/{react-nextjs,react-vanilla,expo-rn,node-cli,supabase-rls}/README.md` を作成する。共通テンプレ構造に従い、5 ファイル全体でトーンを揃える。

## 入力

- SPEC-0005 §実装メモ §各 profile の想定スタック / §共通テンプレ構造
- philosophy: 全 4 ファイル（profile の判断根拠）
- execution-stack: scripts / .claude / package.scripts.fragment.json（カスタマイズ対象）

## 出力

各 README 60-200 行、共通構造（H1 / ステータス / 目的 / 対象スタック / 推奨ツール / カスタマイズ案 / 注意事項 / 隣接 profile / 出典）。

### react-nextjs
- 対象: Next.js App Router + TypeScript
- 推奨: TS, oxlint, React Doctor, Knip, Playwright, Semgrep（フル）
- 注意: Pages Router 利用時は別途調整

### react-vanilla
- 対象: 純 React + TypeScript（Vite / CRA 等）
- 推奨: TS, oxlint, React Doctor（任意）, Knip, Playwright（任意）, Semgrep
- 注意: Next.js 機能不在のため一部 RD 診断は対象外

### expo-rn
- 対象: Expo / React Native
- 推奨: TS, oxlint, Knip, Semgrep。**React Doctor は非対応**
- 注意: E2E は Playwright ではなく Maestro / Detox 等（参考リンク）

### node-cli
- 対象: Node CLI / Library
- 推奨: TS, oxlint, Vitest, Knip, Semgrep
- 注意: UI / E2E なし、Playwright 不要

### supabase-rls（addon profile）
- 対象: Supabase + RLS を持つプロジェクト
- 推奨: 他 profile に **追加** で pgTAP, InBucket, service_role 注意
- 注意: 他 profile と組み合わせる前提

## File Scope

作成: `package-templates/profiles/{react-nextjs,react-vanilla,expo-rn,node-cli,supabase-rls}/README.md`
変更/削除: なし
変更禁止: TASK-0020 の対象、SAGE 内部物、他 SPEC の成果物

## 禁止事項

PLAN-0005 §Forbidden Shortcuts 継承 + 固有:
- gakuten / 学生転職 / apps/web / web_ipo / academy / internships の使用
- 5 ファイルのトーン不揃い（共通テンプレ構造から逸脱）
- 各 profile の他 profile への相互リンク忘れ
- 実体ファイル（settings.json 等）を作成（Phase 1/2 で扱う）
- secret / 危険コマンドの例示

## 完了条件

- [ ] 5 ファイル作成、各 H1 タイトル、`## 出典` セクション
- [ ] 各 README に「推奨ツール」セクション
- [ ] 各 README に philosophy への相互リンク（`grep -l "../../docs/philosophy" <file>`）
- [ ] expo-rn が「React Doctor 非対応」を明記
- [ ] supabase-rls が「他 profile と組み合わせる」前提を明記
- [ ] gakuten 固有語不在
- [ ] secret パターン不在
- [ ] 各ファイル行数 60-250

## Done Definition
SPEC-0005 AC-01（部分）, AC-02（部分）, AC-03, AC-06, AC-07, AC-08, AC-09, AC-10, AC-11（部分）。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0005（Gate 1/2/3/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0019 |
| Error Resolution | SPEC-0005 |
| failures/anti-patterns | PLAN-0005 |
| 採用メトリクス | PLAN-0005 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1: 該当ファイル復元 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
