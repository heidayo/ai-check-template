# TASK-0020: profiles/README.md 作成

## メタデータ

| フィールド | 内容 |
|---|---|
| TASK-ID | TASK-0020 |
| SPEC-ID | SPEC-0005 |
| PLAN-ID | PLAN-0005 |
| ステータス | Done |
| 担当 | Implementation |
| 並列可否 | Yes |
| 依存 | none |
| 見積 | 25m |

## 責務

`package-templates/profiles/README.md` を作成。5 profile のインデックスとして、各 profile の概要・選び方を示す。

## 入力

- SPEC-0005 §背景・目的 §実装メモ §各 profile の想定スタック
- TASK-0019 と並列実装中の 5 profile README（ファイル名と概要は SPEC で既定）

## 出力

50-200 行。

- H1: `# profiles/`
- ステータス
- 目的（profile = 典型スタックの抽象）
- 5 profile 一覧表（profile 名 / 対象スタック / 主な特徴 / 注意 / リンク）
- 選び方ガイド（フローチャート風または条件分岐）
- 組み合わせ（supabase-rls は他 profile に addon）
- Phase 0 ステータス（README のみ、実体は Phase 1/2）
- 隣接思想（philosophy への相互リンク）
- 出典

## File Scope

作成: `package-templates/profiles/README.md`
変更/削除: なし
変更禁止: TASK-0019 の対象、SAGE 内部物、他 SPEC 成果物

## 禁止事項

PLAN-0005 §Forbidden Shortcuts 継承 + 固有:
- 5 profile のいずれかを README で言及漏れ
- 「絶対動く」「100% 安全」等の過剰保証
- gakuten 固有語
- profile-specific な実体への参照（Phase 0 では存在しない）

## 完了条件

- [ ] ファイル作成、H1 タイトル、`## 出典` セクション
- [ ] 5 profile 名すべて登場（`grep -cE "react-nextjs|react-vanilla|expo-rn|node-cli|supabase-rls" package-templates/profiles/README.md` が 5 以上）
- [ ] philosophy への相互リンク
- [ ] gakuten 固有語不在
- [ ] secret パターン不在
- [ ] 行数 50-250

## Done Definition
SPEC-0005 AC-01（部分）, AC-02（部分）, AC-04, AC-05, AC-08, AC-09, AC-11（部分）。

## SPEC/PLAN 継承事項

| 項目 | 参照先 |
|---|---|
| Quality Gate | PLAN-0005（Gate 1/2/3/4） |
| テスト種別 | structural + grep |
| カバレッジ | N/A |
| commit-msg hook | TASK-0020 |
| Error Resolution | SPEC-0005 |
| failures/anti-patterns | PLAN-0005 |
| 採用メトリクス | PLAN-0005 |
| 段階移行 | Pending → Done |
| ロールバック | Level 1 |

## 実行ログ
| RUN-ID | TBD |
| 開始 / 完了 / 結果 / Gate | TBD |
