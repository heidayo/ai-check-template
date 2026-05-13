# SPEC-0006: Phase 0 完了の計画ドキュメント反映

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0006 |
| ステータス | Approved |
| 作成日    | 2026-05-13 |
| 更新日    | 2026-05-13 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0001..SPEC-0005（全 Approved 前提） |
| 権限レベル | platform |

## 背景・目的

Phase 0 の全 7 サブ成果物が SPEC-0001..SPEC-0005 で実装・Approved 済となった。一方、計画ドキュメント 3 ファイル（`README.md` / `package-templates/README.md` / `.claude/rules/ai-check-template.md`）の Phase 表は依然「Phase 0: 進行中」のままで、現状と乖離している。

本 SPEC で「計画 vs 実装の整合」を再確保する。SPEC-0002 で発見した同種のアンチパターン（計画ドキュメントに変更を反映し忘れる）を繰り返さないため、Phase 0 完了の節目で機械的にチェックする。

## 対象ユーザー

- 本リポを参照するすべての利用者（Phase 状況を README で確認する）
- AI 駆動開発エージェント（実装方針を `.claude/rules/ai-check-template.md` から取得する）

## スコープ（含む）

- `README.md` の §段階 表で Phase 0 を「進行中」→「完了」に更新
- `package-templates/README.md` の §ステータス で「Phase 0 — 骨格設計中」→「Phase 0 — 完了」相当に更新
- `.claude/rules/ai-check-template.md` の §開発フェーズ 表で Phase 0 を「進行中」→「完了」に更新
- 必要に応じて Phase 1 のステータスを「未着手」→「着手準備中 / dogfooding 募集中」等に微調整（過剰な表現にしない）

## スコープ外

- Phase 1 dogfooding の SPEC 起票（別 SPEC）
- README.md / ai-check-template.md の他セクションの改編
- Phase 2 / Phase 3 のスケジュール変更
- `git push` 等の公開操作

## File Scope

**書き込み許可:**
- `README.md`
- `package-templates/README.md`
- `.claude/rules/ai-check-template.md`

**変更禁止:** 上記 3 ファイル以外。SAGE 内部物。既存 SPEC/PLAN/TASK。

## CLAUDE.md / .claude/rules/ 連携

| ルール | 実装時の遵守事項 |
|---|---|
| 言語規約 | 日本語本文 |
| 配布物分離 | `package-templates/README.md` のみ配布物。`README.md` / `.claude/rules/ai-check-template.md` はリポ自身のドキュメント |

## Forbidden Shortcuts

- 3 ファイル以外の改変
- Phase 1 への過剰な進捗主張（未着手なのに「進行中」と書く等）
- Phase 0 完了を「100% 完全」と過剰保証
- gakuten 等固有語の混入
- TODO / FIXME を残す

## 要件

### 機能要件
- [FR-01] 3 ファイルすべてで Phase 0 が「完了」もしくは同等の表現
- [FR-02] 各 Phase 表が SPEC-0001..SPEC-0005 のコミット履歴と整合
- [FR-03] Phase 1 ステータスは控えめに（「未着手」または「準備中」等）

### 非機能要件
- [NFR-01] 各ファイルの変更は最小限（+5 行以内が目安）
- [NFR-02] テスト種別: structural test（grep 検証）
- [NFR-03] カバレッジ: N/A

### セキュリティ要件
- [SEC-01] 該当なし

### 運用要件
- [OPS-01] 本 SPEC 完了で Phase 0 のクロージャ完了。次は Phase 1 dogfooding の起票判断

## Quality Gate マッピング

| Gate | 対応 AC |
|---|---|
| Gate 1: Structural | AC-01..AC-04 |
| Gate 2: Functional | AC-05 |
| Gate 3: Security | N/A |
| Gate 4: Architecture | AC-06 |

## 受け入れ条件

- [ ] AC-01: 3 ファイルすべて存在（更新前から既存）
- [ ] AC-02: 3 ファイルすべてで Phase 0 行に「完了」または「Completed」または「✅」マーク。表形式（`| 0 |`）と本文形式（`Phase 0`）両方を許容（`grep -E "(Phase 0|^\| 0 )" README.md package-templates/README.md .claude/rules/ai-check-template.md | grep "完了" | cut -d: -f1 | sort -u | wc -l` が 3）
- [ ] AC-03: 3 ファイルで「進行中」表記が Phase 0 行から消えている（`grep -A1 "Phase 0" README.md package-templates/README.md .claude/rules/ai-check-template.md | grep -c "進行中"` が 0）
- [ ] AC-04: gakuten 固有語が新規追加されていない（diff ベース）
- [ ] AC-05: 3 ファイルの差分が小さい（各 `git diff --stat HEAD -- <file>` で +1..+10 行）
- [ ] AC-06: SAGE 内部物・他配布物への変更なし（`git diff --name-only HEAD` の結果が 3 ファイルのみ）

## 異常系

- 想定エラー1: 既存表記と異なるフォーマットで Phase 0 完了を書く → AC-02 で機械検出
- 想定エラー2: 他セクションを誤って編集 → AC-05/06 で検出
- 境界ケース1: 「Phase 0 完了」の表記揺れ（完了 / Completed / Done / ✅）→ AC-02 の OR 条件で対応

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-02 | Phase 0 行に「完了」を追加 |
| AC-03 | Phase 0 行の「進行中」を削除 |
| AC-04 | 新規 gakuten 固有語を削除 |
| AC-05/06 | 他セクション変更を `git checkout HEAD -- <file>` で revert、最小差分で再実装 |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| 計画 vs 実装乖離が再発（Phase 1 完了時に同様の漏れ） | `sage/failures.md`、3 回累積で `sage/anti-patterns.md` 昇格 | リポオーナー |

### anti-patterns 参照
- 計画と実装の乖離（SPEC-0002 の §Knowledge Management で既出）。本 SPEC は同パターンの再発防止策

## 契約
- commit-msg hook: TASK-ID 必須
- API/DB/イベント: なし

## リスク

- リスク1: 表記揺れで AC-02 が誤判定 → AC-02 を OR 条件で寛容に
- リスク2: Phase 1 の表記を過剰に上げる → AC で「未着手 or 準備中」に限定
- リスク3: Phase 表更新が Phase 1 dogfooding 開始の十分条件と誤解される → Phase 1 開始は別 SPEC が必要、本 SPEC では status の事後反映のみ

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| 整合性 | 3 ファイルすべて Phase 0 完了表記 |
| 最小差分 | 各ファイル +1..+10 行 |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| SPEC Draft → Approved | AC-01..AC-06 全 pass + 95+ 採点 |
| Phase 0 クロージャ完了 | SPEC-0006 Approved |

## 実装メモ

### 変更箇所（具体）

#### `README.md` §段階

before:
```
| 0 | 思想 + テンプレ骨格設計 | 進行中 |
```
after:
```
| 0 | 思想 + テンプレ骨格設計 | 完了（SPEC-0001..SPEC-0005） |
```

#### `package-templates/README.md` §ステータス

before:
```
## ステータス
Phase 0 — 骨格設計中。実体ファイルは Phase 1 dogfooding と並行で埋めていく。
```
after:
```
## ステータス
Phase 0 — 完了（SPEC-0001..SPEC-0005 で全 7 サブ成果物の骨格を整備）。Phase 1 dogfooding で実プロジェクト検証を行い、フィードバックを SPEC 改訂に反映する予定。
```

#### `.claude/rules/ai-check-template.md` §開発フェーズ

before:
```
| 0 | 思想 + テンプレ骨格設計 | 進行中 |
```
after:
```
| 0 | 思想 + テンプレ骨格設計 | 完了 |
```

### TASK 分解
1 TASK で完結（File Scope 3 ファイル、変更は局所的）。

## ロールバック

| Level | 手順 |
|---|---|
| Level 1 | `git checkout HEAD -- <file>` で個別復元 |
| Level 2 | 3 ファイル一括復元 |
| Level 3 | SPEC を Draft に戻し再起票 |

## Properties

### Invariants
- [INV-01] (Gate 4) 変更は 3 ファイルに限定、SAGE 内部物・配布物に拡散しない
- [INV-02] (Gate 4 / 横断) gakuten 固有語が新規追加されない

### Pre-conditions
- [PRE-01] (Gate 1) SPEC-0001..SPEC-0005 すべて Approved

### Post-conditions
- [POST-01] (Gate 2) 3 ファイルすべてに Phase 0 完了表記
- [POST-02] (Gate 4) 他セクションに変更なし

### Assumptions
- [ASM-01] 「完了」「Completed」「✅」のいずれの表記でも AC-02 を満たす（表記揺れを許容）

## 関連ID

- 依存 SPEC: SPEC-0001..SPEC-0005
- PLAN-ID: PLAN-0006
- TASK-ID: TASK-0022
