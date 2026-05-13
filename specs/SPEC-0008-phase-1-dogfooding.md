# SPEC-0008: Phase 1 dogfooding 運用ルール

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0008 |
| ステータス | Approved |
| 作成日    | 2026-05-13 |
| 更新日    | 2026-05-13 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0001..0006（Phase 0 全成果物）+ SPEC-0007（本リポ SAGE 整備） |
| 権限レベル | platform |

## 背景・目的

Phase 0 で `package-templates/` の 7 サブ成果物（philosophy / ci-examples / scripts / .claude / package.scripts.fragment.json / prompts / profiles）の骨格が揃った。これらは Notion 主体 4 文書からの抽出物だが、**実プロジェクトで使えるか・現実に適合するか未検証**である。

Phase 1 dogfooding では、複数の実プロジェクトで package-templates を運用し、フィードバックを SPEC 改訂に反映する。本 SPEC は dogfooding の **運用ルール**（プロセス）を定義する。実行（実プロジェクトでの運用）自体は SPEC スコープ外で、各 dogfooding 実施は別 TASK / SPEC で扱う。

主な定義:
- 対象プロジェクトの選定基準
- 導入手順（手動コピー / 部分採用）
- フィードバック収集ルール（誰が・いつ・どこに記録）
- Phase 1 → Phase 2 への昇格条件
- 失敗パターン → SPEC 改訂のループ

## 対象ユーザー

- 本リポオーナー（dogfooding 実施判断 + フィードバック収集）
- dogfooding 対象プロジェクトの開発者（package-templates を使う）
- Phase 2 で CLI 化を担当する将来のコントリビュータ（Phase 1 知見を入力に使う）

## スコープ（含む）

- `docs/phase-1-dogfooding-protocol.md` を作成（運用ルール本体、150-400 行）
- `docs/phase-1-feedback-template.md` を作成（フィードバック記録テンプレ、80-200 行）

合計 2 ファイル。

## スコープ外

- 実際の dogfooding 実行（具体的なプロジェクトへの導入）→ 別 TASK で個別実施
- Phase 2 CLI 実装（`npx ai-check-template init`）
- package-templates 本体の改訂（フィードバックを受けてから別 SPEC で対応）
- gakuten 等特定プロジェクトの workflow 整理
- `sage/failures.md` への直接追加（運用ルールで参照するのみ、本 SPEC では追加しない）
- 配布物（`package-templates/`）への変更

## File Scope

**書き込み許可:**
- `docs/phase-1-dogfooding-protocol.md`
- `docs/phase-1-feedback-template.md`

**読み込みのみ:** `package-templates/`, `sage/governance.md`, `sage/failures.md`, `README.md`

**変更禁止:** SAGE 内部物、配布物、既存 SPEC/PLAN/TASK、`docs/{claude-collaboration-brief.md,codex-delegation-packet.md}`（SAGE 管理 + gitignored）

## CLAUDE.md / .claude/rules/ 連携

| ルール | 実装時の遵守事項 |
|---|---|
| 汎用ファースト | dogfooding 対象プロジェクトは「複数の異なるスタック」を含める（gakuten 単独依存禁止） |
| 言語規約 | docs/ 配下は日本語、コマンド・識別子は英語 |
| 配布物分離 | `docs/` は本リポの project doc（配布物ではない） |

## Forbidden Shortcuts

- 単一プロジェクト（gakuten のみ）での dogfooding を「Phase 1 完了」と認定
- フィードバック記録なしで Phase 1 → Phase 2 昇格
- gakuten 固有の判断を Phase 2 の package-templates にそのまま反映
- secret / token / API key の含有
- TODO / FIXME を残す
- File Scope 外への書き込み

## 要件

### 機能要件
- [FR-01] 2 ファイル全存在
- [FR-02] dogfooding-protocol.md が以下を含む:
  - 対象プロジェクト選定基準
  - 導入手順
  - フィードバック収集ルール
  - Phase 1 → Phase 2 昇格条件
  - 失敗パターン → SPEC 改訂ループ
- [FR-03] feedback-template.md がフィードバック 1 件分の記録テンプレ（プロジェクト名・採用 profile・問題・期待・原因仮説・推奨修正・SPEC-ID 連携欄）
- [FR-04] protocol.md が feedback-template.md への相互リンクを持つ
- [FR-05] protocol.md が `package-templates/` 配下の各サブ成果物（philosophy / scripts / etc.）への参照リンクを持つ

### 非機能要件
- [NFR-01] dogfooding-protocol.md: 150-400 行
- [NFR-02] feedback-template.md: 80-200 行
- [NFR-03] テスト種別: structural test（ファイル存在 + grep）
- [NFR-04] カバレッジ閾値: N/A — 運用ドキュメント

### セキュリティ要件
- [SEC-01] 該当なし（プロセス文書、認可境界・秘密情報・実行コードなし）

### 運用要件
- [OPS-01] 本 SPEC 完了後、Phase 1 dogfooding を実プロジェクトで開始可能。最初の dogfooding 実施は本 SPEC とは別タスク
- [OPS-02] dogfooding でのフィードバックを `sage/failures.md` に記録、3 回累積パターンで `sage/anti-patterns.md` 昇格
- [OPS-03] Phase 1 終了時に Phase 2（CLI 化）SPEC を起票

## Quality Gate マッピング

| Gate | 対応 AC |
|---|---|
| Gate 1: Structural | AC-01..AC-04 |
| Gate 2: Functional | AC-05..AC-07 |
| Gate 3: Security | N/A（SEC-01） |
| Gate 4: Architecture | AC-08, AC-09 |

## 受け入れ条件

### 正常系
- [ ] AC-01: 2 ファイル全存在（`ls docs/phase-1-dogfooding-protocol.md docs/phase-1-feedback-template.md`）
- [ ] AC-02: 各ファイル冒頭が `# ` で始まる H1（`head -1 docs/phase-1-*.md | grep -c "^# "` が 2）
- [ ] AC-03: 各ファイル末尾に `## 出典` または `## 関連リンク` セクション（`grep -lE "^## (出典|関連リンク)" docs/phase-1-*.md | wc -l` が 2）
- [ ] AC-04: 各ファイル `Draft v0.1` 注記を持つ（`grep -l "Draft v0.1" docs/phase-1-*.md | wc -l` が 2）

### 機能検証
- [ ] AC-05: dogfooding-protocol.md が必須セクションを含む（5 つすべて: `for s in "対象プロジェクト選定" "導入手順" "フィードバック収集" "昇格条件" "ループ"; do grep -q "$s" docs/phase-1-dogfooding-protocol.md || exit 1; done`）
- [ ] AC-06: feedback-template.md がフィードバック記録テンプレを含む（`grep -qE "プロジェクト名|採用 profile|問題|期待|原因" docs/phase-1-feedback-template.md`）
- [ ] AC-07: protocol.md が feedback-template.md と package-templates への参照を持つ（`grep -q "feedback-template" docs/phase-1-dogfooding-protocol.md && grep -q "package-templates" docs/phase-1-dogfooding-protocol.md`）

### 異常系
- [ ] AC-08: gakuten 固有語が含まれない（`grep -riE "学生転職|apps/web|web_ipo|academy|internships" docs/phase-1-*.md` が空。注: 「gakuten」単独は dogfooding 対象例として登場許容、ただし固有の **アプリ構造名は禁止**）
- [ ] AC-10: secret 直書きパターン不在（`grep -riE "(api[-_]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*['\"]" docs/phase-1-*.md` が空）

### 配置検証
- [ ] AC-09: スコープ漏れ検知。新規ファイルは以下のみ（`git status --short | awk '$1 == "??" {print $2}'` の結果が以下に限定される）:
  - `docs/phase-1-dogfooding-protocol.md`
  - `docs/phase-1-feedback-template.md`
  - `specs/SPEC-0008-*.md`
  - `plans/PLAN-0008-*.md`
  - `tasks/TASK-0026-*.md`, `tasks/TASK-0027-*.md`, `tasks/TASK-0028-*.md`
  - その他なし

## 異常系

- 想定エラー1: protocol.md が抽象的すぎて dogfooding を始められない → 初回 dogfooding feedback で発覚、SPEC 改訂
- 想定エラー2: 単一プロジェクト依存（gakuten のみ）に陥る → protocol.md で「複数プロジェクト」を必須と明示
- 想定エラー3: フィードバック記録形式が散逸 → feedback-template.md で統一
- 想定エラー4: gakuten 固有語混入 → AC-08
- 境界ケース1: dogfooding 対象プロジェクトが見つからない → protocol.md で「マッチング基準」と「対象不在時の代替（仮想プロジェクト / OSS）」を記載

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | 不足ファイル作成 |
| AC-02 | H1 タイトル追加 |
| AC-03 | 「## 出典」または「## 関連リンク」セクション追加 |
| AC-04 | 「Draft v0.1」注記追加 |
| AC-05 | protocol.md に 5 必須セクション追加 |
| AC-06 | feedback-template.md にテンプレ項目追加 |
| AC-07 | 相互リンク追加 |
| AC-08 | apps/web 等の固有名を汎用化（「monorepo apps/<name>」等） |
| AC-10 | secret パターン削除 |

## Knowledge Management

| シナリオ | 記録先 | 責任者 | タイミング |
|---|---|---|---|
| dogfooding で package-templates が動かない | `sage/failures.md` | リポオーナー | dogfooding 中、発見時 |
| 同種失敗 3 回累積 | `sage/anti-patterns.md` 昇格 | リポオーナー | 四半期レビュー |
| protocol.md が現実と乖離 | `sage/failures.md` + SPEC-0008 改訂 | リポオーナー | 初回 dogfooding 完了時 |
| 単一プロジェクト依存リスク顕在化 | `sage/anti-patterns.md` 直接記録 | リポオーナー | 顕在化時 |

### anti-patterns 参照
- **Big Bang Prompt**: protocol.md と feedback-template.md を 1 TASK で書かず分割
- **計画と実装の乖離**: Phase 0 で発見した同パターン。dogfooding 完了時に必ず計画ドキュメント整合チェック

## 契約

- API/DB/イベント: なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: protocol.md が「理想論」で実プロジェクト適用時に乖離 → 軽減策: Phase 1 中に複数回 SPEC 改訂前提と明記、初回 dogfooding 後の改訂を予定
- リスク2: 単一プロジェクト（gakuten）依存で汎用性検証が不足 → 軽減策: protocol.md で **最低 2 プロジェクト** を必須化、種類の異なるスタック（Next.js + Node CLI 等）を推奨
- リスク3: フィードバック記録が属人化 → 軽減策: feedback-template.md でフォーマット標準化、`sage/failures.md` 形式と整合
- リスク4: Phase 1 が長引く / 終わらない → 軽減策: 昇格条件を客観的に定義（n プロジェクトで採用率 50%+ 等）
- リスク5: dogfooding 結果が CI 化されない（手動運用に留まる）→ 軽減策: protocol.md で「Phase 2 で CLI 化」の道筋を明示

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| ファイル存在 | 2 ファイル全存在 |
| protocol 必須セクション | 5 セクション存在 |
| dogfooding 採用率（Phase 1 中） | 2 プロジェクト以上で `package-templates/` を試用、各 50% 以上の成果物を改訂なしで採用 |
| フィードバック記録率 | dogfooding 期間中に最低 5 件の feedback を `sage/failures.md` に記録 |
| Phase 1 → Phase 2 昇格 | フィードバック反映 SPEC（package-templates 改訂）が 1 件以上 Approved |

## 段階移行

| 移行 | 昇格条件 | 検証コマンド / 判定 |
|---|---|---|
| SPEC Draft → Approved | AC-01..AC-10 全 pass + 95+ 採点 | `bash scripts/sage-validate.sh` + 自己採点 |
| Phase 1 開始 | SPEC-0008 Approved | 本 SPEC 完了 |
| Phase 1 初回 dogfooding 完了 | 1 プロジェクトで package-templates を導入、feedback 1 件以上記録 | 手動確認 |
| Phase 1 中間レビュー | 2 プロジェクトで dogfooding、feedback 3 件以上 | 手動確認 |
| Phase 1 → Phase 2 昇格 | 採用メトリクス全項目 pass + リポオーナー承認 | 手動確認 |

## 実装メモ

### dogfooding-protocol.md の構成

```markdown
# Phase 1 Dogfooding Protocol

> ステータス: Draft v0.1（初回 dogfooding 後に改訂予定）

## 概要
（Phase 1 の目的、なぜ dogfooding が必要か）

## 対象プロジェクト選定基準
- 最低 2 プロジェクト（単一依存禁止）
- 異なるスタック（Next.js / Node CLI / Expo 等）を含める
- ai-check-template の 5 profile のうち最低 2 種類をカバー

## 導入手順
1. profile を選択（react-nextjs / react-vanilla / expo-rn / node-cli / supabase-rls）
2. `package-templates/` の該当 profile + 共通成果物を手動コピー
3. package.json scripts のマージ
4. .claude/settings.json への hook fragment マージ
5. CI YAML の配置
6. AI 駆動開発を試行

## フィードバック収集ルール
- 記録場所: `sage/failures.md`（FAIL-XXXX 採番）
- 記録タイミング: 「動かない / 違和感 / 不要 / 不足」を感じたら即時
- フォーマット: `docs/phase-1-feedback-template.md` に従う
- レビュー: リポオーナーが週次で集約 → SPEC 改訂判断

## Phase 1 → Phase 2 昇格条件
- 2 プロジェクト以上の dogfooding 完了
- フィードバック 5 件以上記録
- フィードバック反映 SPEC 改訂が 1 件以上 Approved
- リポオーナー承認

## 失敗パターン → SPEC 改訂ループ
（フィードバック → 分析 → SPEC 改訂 → 再 dogfooding）

## 関連リンク
- package-templates 各サブ成果物
- feedback-template.md
- sage/failures.md / sage/anti-patterns.md
```

### feedback-template.md の構成

```markdown
# Phase 1 Feedback Template

> ステータス: Draft v0.1

## 使い方
本テンプレを 1 件のフィードバックごとに `sage/failures.md` に追記する。

## テンプレ本体

\`\`\`markdown
### FAIL-XXXX
- 発生日: YYYY-MM-DD
- プロジェクト名: <汎用名 or 識別子>
- 採用 profile: <react-nextjs / ... / 複合>
- 該当 package-templates 成果物: <philosophy/scripts/.claude/...>
- 問題: <観測した事実>
- 期待: <本来どうなるべきか>
- 原因仮説: <推測>
- 推奨修正: <package-templates の改訂案>
- 影響度: low / medium / high / critical
- SPEC-ID 連携: <影響を受ける SPEC-XXXX>
- 対応ステータス: open / investigating / fixed / wontfix
\`\`\`

## 記入例
（具体的なフィードバック例）

## 関連リンク
- protocol.md
- sage/failures.md
```

### TASK 分解の指針

- TASK-A: protocol.md 作成
- TASK-B: feedback-template.md 作成
- TASK-C: AC 検証

3 TASK。並列化のため A と B を独立 TASK にする。

## ロールバック手順

| Level | 手順 |
|---|---|
| Level 1 | 該当ファイルのみ復元 |
| Level 2 | `git checkout HEAD -- docs/phase-1-*.md` で一括復元 |
| Level 3 | SPEC を Draft に戻し再起票 |

## Properties

### Invariants
- [INV-01] (Gate 4) 2 ファイルは `docs/` 配下のみ。配布物（`package-templates/`）に作らない
- [INV-02] (Gate 4 / 横断) gakuten 固有の app 構造名（apps/web 等）が含まれない（汎用化）

### Pre-conditions
- [PRE-01] (Gate 1) Phase 0 全 SPEC（SPEC-0001..0006）が Approved

### Post-conditions
- [POST-01] (Gate 2) 2 ファイル存在 + 必須セクション含有
- [POST-02] (Gate 4) `docs/` 配下のみ、`package-templates/` には新規ファイルなし

### Assumptions
- [ASM-01] 実 dogfooding は本 SPEC 完了後に別 TASK で実施。本 SPEC は protocol 整備のみ
- [ASM-02] フィードバック収集の中心は `sage/failures.md`（既存 SAGE 仕組み）に乗る

## 関連ID

- 依存 SPEC: SPEC-0001..0007
- PLAN-ID: PLAN-0008
- TASK-ID: TASK-0026..0028
