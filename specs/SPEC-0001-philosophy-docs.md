# SPEC-0001: package-templates/docs/philosophy/ の整備

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0001 |
| ステータス | Approved |
| 作成日    | 2026-05-13 |
| 更新日    | 2026-05-13 |
| 担当Agent | Spec Agent |
| 依存SPEC  | none |
| 権限レベル | platform |

## 背景・目的

`ai-check-template` の Phase 0（思想 + テンプレ骨格設計）の最初の成果物として、AI 駆動開発で再利用可能な「テスト設計思想」のドキュメント群を `package-templates/docs/philosophy/` に整備する。

このドキュメント群は Notion 主体文書（テストフロー再設計 / 無料で作る AI エージェント開発診断フロー / AI 駆動開発時代に押さえる QA 技法）の知見を、特定プロジェクト（gakuten 等）に依存しない**汎用ドキュメント**として抽出・再構成したもの。Phase 1 dogfooding でツール導入を実証する前段として、まず「何を検証するか・どう設計するか」の理論パートを固める。プロンプト雛形・プロファイル・スクリプト・CLI 実装は別 SPEC で扱う。

## 対象ユーザー

AI 駆動開発（Claude Code / Codex / Cursor 等）でテストフローを構築するソフトウェアエンジニア。特定のフレームワーク・プロジェクトに依存しない、テスト設計思想の理論を学びたい人。

## スコープ（含む）

- `package-templates/docs/philosophy/formal-name-match.md` を作成（形名参同：事前宣言した成功基準と実測値の照合）
- `package-templates/docs/philosophy/test-pyramid.md` を作成（責務分割：Static / Unit / Integration / E2E / DB-RLS / Monitoring）
- `package-templates/docs/philosophy/given-when-then.md` を作成（受け入れ条件先行：AI に GWT で観点を先出しさせる運用）
- `package-templates/docs/philosophy/qa-techniques.md` を作成（QA 技法：同値分割・境界値・デシジョンテーブル・状態遷移・エラー推測・チェックリスト）
- 各ドキュメントの末尾に出典セクションを設け、Notion 主体文書への参照を記載
- 4 ドキュメント間で共通用語（「形名参同」「責務分割」等）が一貫した意味で使われていること

## スコープ外（明示的に除外）

- プロンプト雛形（`package-templates/prompts/` 配下）— 別 SPEC で扱う
- プロファイル（`package-templates/profiles/` 配下）— 別 SPEC で扱う
- テストフロー実行スクリプト（`package-templates/scripts/ai-check.sh` 等）— 別 SPEC で扱う
- Claude Code hook 設定の配布（`package-templates/.claude/settings.hook-fragment.json`）— 別 SPEC で扱う
- CLI 実装（`npx ai-check-template init`）— Phase 2 で扱う
- gakuten 固有の判断・現状分析・workflow 整理 — 本リポのスコープ外
- SAGE 統合の具体実装（`--with-sage` オプションの挙動）— Phase 2 で扱う
- React Doctor / Knip / Semgrep 等の個別ツール解説 — 「テストフローテンプレ」側の SPEC で扱う
- Supabase / pgTAP / InBucket の具体テンプレート — `supabase-rls` プロファイル系 SPEC で扱う

## File Scope（SPEC レベル）

実装フェーズ（PLAN → TASK 分割）で TASK ごとに File Scope を絞るが、SPEC 全体としての File Scope を以下で固定する。

**書き込み許可:**
- `package-templates/docs/philosophy/formal-name-match.md`
- `package-templates/docs/philosophy/test-pyramid.md`
- `package-templates/docs/philosophy/given-when-then.md`
- `package-templates/docs/philosophy/qa-techniques.md`

**読み込みのみ:**
- `.claude/rules/ai-check-template.md`（本リポの汎用ファースト原則・言語規約）
- `README.md`（Phase 0/1/2/3 ロードマップ）
- Notion 主体文書（出典）

**変更禁止:**
- `CLAUDE.md` / `AGENTS.md` / `sage/` / `.sage/` / `templates/hooks/` / `templates/sage/` 等 SAGE 内部物
- `specs/_template.md`（SAGE 管理）
- 本 SPEC 以外の `specs/*.md`

## CLAUDE.md / .claude/rules/ 連携

実装エージェント（Phase 0 doc 作成担当）は以下のルールに従う。これらは `.claude/rules/ai-check-template.md` に既に明文化されているため、本 SPEC では参照のみ行い、CLAUDE.md への追記は行わない。

| ルール | 出典 | 実装時の遵守事項 |
|---|---|---|
| 汎用ファースト | ai-check-template.md §設計原則1 | gakuten 固有判断はプロファイル / オプションに抽象化。直接記述しない |
| 言語規約 | ai-check-template.md §言語規約 | ドキュメント本文は日本語、コード識別子・ファイル名・コマンドは英語 |
| 配布物と SAGE 内部物の分離 | ai-check-template.md §配布物と SAGE 内部物の分離 | 配布物は `package-templates/` 配下のみ。`templates/` は SAGE 用なので使用しない |
| 主体 4 文書 | ai-check-template.md §主体文書 | Notion Doc #1, #2, #3, #28 を出典として明示する |

## Forbidden Shortcuts（禁止事項）

実装時に AI エージェントに以下を許可しない。

- `package-templates/` 配下に `TODO` / `FIXME` を残してコミット
- 本文に gakuten / 学生転職 / 特定 apps 構造名を含める（AC-04 で機械検出）
- Notion 主体文書からの引用なしに「断言」する記述（出典なき主張）
- 4 ファイル間で同じ用語を異なる定義で使う（AC-05 で部分検出）
- ファイル冒頭の「Draft v0.1（Phase 1 dogfooding 後に改訂予定）」注記を省略
- 本 SPEC の File Scope 外への変更
- `--no-verify` / `--force` 等の hook bypass（SAGE hook で block）

## 要件

### 機能要件
- [FR-01] 4 ファイルすべてが `package-templates/docs/philosophy/` 配下に存在する
- [FR-02] 各ファイルは Markdown 形式で、H1 タイトル → H2 セクションの階層を持つ
- [FR-03] 各ファイルは末尾に「## 出典」セクションを持ち、依拠する Notion 主体文書を明示する
- [FR-04] 4 ファイル間で用語と概念が整合している
- [FR-05] 各ドキュメントは特定のプロジェクト / フレームワークに依存しない記述である
- [FR-06] 各ファイル冒頭に「Draft v0.1（Phase 1 dogfooding 後に改訂予定）」注記が存在する

### 非機能要件
- [NFR-01] ドキュメント長: 1 ファイル 150-500 行程度（読了目安 10 分以内）
- [NFR-02] 可読性: 日本語本文、コード識別子・ファイル名・コマンドは英語
- [NFR-03] テスト種別: structural test のみ（ファイル存在・grep パターンの構造検証）。動的テスト（unit / integration / e2e）は対象外 — 本 SPEC は実行コードを含まないため
- [NFR-04] カバレッジ閾値: N/A — 本 SPEC は実行コードを含まないため code coverage は適用しない。代替指標として「Notion 主体 4 文書のうち本 SPEC が参照する 3 文書（Doc #1, #2, #3）のすべての主要概念が 4 ファイルのいずれかでカバーされる」を満たす（AC-08 で機械検証）

### セキュリティ要件
- [SEC-01] 該当なし — 本 SPEC はドキュメント作成のみで、認可境界・秘密情報・実行コードを含まない

### 運用要件
- [OPS-01] 4 ドキュメントは Phase 1 dogfooding で実プロジェクトに導入される際の理論的根拠となる
- [OPS-02] dogfooding で「ドキュメントが現実と乖離している」フィードバックが得られた場合は、人間（リポオーナー）が `sage/failures.md` に検出 → 記録し、Phase 1 中に SPEC を更新（差分追加 or 別 SPEC 起票）して対応する。AI エージェント単独での SPEC 更新は禁止

## Quality Gate マッピング

本 SPEC の AC を SAGE Quality Gate 1-5 にマップする。Phase 0 では Gate 5（リリース）は対象外。

| Gate | 対応 AC | 検証コマンド |
|---|---|---|
| Gate 1: Structural | AC-01, AC-02, AC-03, AC-06 | `ls`, `head`, `grep`, `wc -l` |
| Gate 2: Functional | AC-04, AC-05, AC-07 | `grep -r`, `grep -l`, 用語整合の機械検証 |
| Gate 3: Security | N/A | SEC-01 該当なし |
| Gate 4: Architecture | AC-08 | INV-01, INV-02 の自動検証（`grep`） |
| Gate 5: Release | N/A | Phase 0 では対象外、Phase 2 npm publish 時に該当 |

## 受け入れ条件（Acceptance Criteria）

正常系・異常系のバランスで定義する（rubric 要件: 異常系 AC 最低 2 件）。

### 正常系（存在・構造検証）
- [ ] AC-01: `ls package-templates/docs/philosophy/{formal-name-match,test-pyramid,given-when-then,qa-techniques}.md` がすべて成功する
- [ ] AC-02: 各ファイル冒頭が `# ` で始まる H1 タイトルを持つ（`head -1 package-templates/docs/philosophy/*.md | grep -c "^# "` で 4 を得る）
- [ ] AC-03: 各ファイル末尾に「## 出典」セクションが存在する（`grep -l "^## 出典" package-templates/docs/philosophy/*.md | wc -l` で 4 を得る）
- [ ] AC-07: 各ファイル冒頭に Draft v0.1 注記が存在する（`grep -l "Draft v0.1" package-templates/docs/philosophy/*.md | wc -l` で 4 を得る）

### 異常系（混入・欠落検出）
- [ ] AC-04: gakuten 固有語が混入していない（`grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/docs/philosophy/` で出力が空 = 終了コード 1）
- [ ] AC-05: 4 ファイルすべてが「形名参同」の語を含む（`grep -l "形名参同" package-templates/docs/philosophy/*.md | wc -l` で 4 を得る）
- [ ] AC-06: ファイル行数が 100-600 行の範囲内（`wc -l package-templates/docs/philosophy/*.md | awk 'NR<=4 && ($1<100 || $1>600){exit 1}'` が終了コード 0）
- [ ] AC-08: 主要概念がカバーされる（`grep -l "Test Pyramid\|テストピラミッド\|責務分割" package-templates/docs/philosophy/test-pyramid.md && grep -l "Given.When.Then" package-templates/docs/philosophy/given-when-then.md && grep -l "同値分割" package-templates/docs/philosophy/qa-techniques.md && grep -l "形名参同" package-templates/docs/philosophy/formal-name-match.md` が全件成功）

## 異常系

最低 1 件。本 SPEC では 6 件を定義。

- 想定エラー1: dogfooding で「実プロジェクトで使えない」とフィードバックされる → Phase 1 中に SPEC 修正で対応
- 想定エラー2: gakuten 固有の判断が紛れ込む → AC-04 で機械検出してブロック
- 想定エラー3: 4 ファイル間で同じ用語が異なる意味で使われる → AC-05 で部分検出、用語の意味整合は PLAN で共通用語集セクション要否を判定
- 想定エラー4: ファイルが空または極端に短い → AC-06 の下限 100 行で検出
- 境界ケース1: Notion 主体文書の記述が gakuten 文脈を含む場合、引用ではなく汎用形に書き換える
- 境界ケース2: ドキュメントが NFR-01 の行数範囲を超える場合、複数ファイルに分割せず内容を圧縮する（AC-06 で機械検出）

## Error Resolution 手順

AC が失敗した場合の対応手順。

| 失敗 AC | エラー内容 | 復旧手順 |
|---|---|---|
| AC-01 | ファイル欠落 | 不足ファイルを `mkdir -p` + Write で作成。SPEC スコープ内で完結 |
| AC-02 | H1 タイトル欠落 | 該当ファイル先頭に `# <概念名>` を追加 |
| AC-03 | 出典セクション欠落 | 該当ファイル末尾に `## 出典` セクションを追加し Notion ページ ID を記載 |
| AC-04 | gakuten 固有語混入 | `grep -ri` で位置特定 → 該当箇所を汎用語に置換。再発防止: 実装エージェントのプロンプトに「gakuten 固有語禁止」を明示 |
| AC-05 | 「形名参同」語欠落 | 該当ファイルに直接記述または `formal-name-match.md` への相互リンクを追加 |
| AC-06 | 行数範囲超過 | 100 行未満: 内容を充実。600 行超過: 内容を圧縮（分割は禁止、複雑化を避けるため） |
| AC-07 | Draft 注記欠落 | 該当ファイル冒頭に `> **ステータス**: Draft v0.1（Phase 1 dogfooding 後に改訂予定）` を追加 |
| AC-08 | 主要概念欠落 | 該当ファイルに概念名と最低 1 段落の説明を追加 |

連続 3 回同じ AC が失敗した場合は `same_fail_abort` で human escalation（`.sage/config.yaml` `same_fail_abort_threshold: 3`）。

## Knowledge Management

### sage/failures.md / sage/anti-patterns.md 連携

| シナリオ | 記録先 | 責任者 | タイミング |
|---|---|---|---|
| dogfooding で実プロジェクト適用時に乖離発見 | `sage/failures.md` | リポオーナー（人間） | Phase 1 中、発見時 |
| AC-04（gakuten 固有語混入）が連続 3 回発生 | `sage/failures.md` | 実装エージェント（自動） + リポオーナー（記録承認） | Verify Gate 失敗時 |
| 同様の lockイン失敗が 3 回累積 | `sage/anti-patterns.md` に昇格 | リポオーナー（人間） | failures.md レビュー時、四半期 1 回 |
| 主体 Notion 文書と乖離するドキュメント記述発見 | `sage/failures.md` | リポオーナー（人間） | dogfooding feedback 受領時 |

更新フォーマット: `failures.md` には日時、SPEC-ID、検出 AC、原因、対応を 1 セクションで記録。

### sage/anti-patterns.md 参照

本 SPEC 実装時、以下のアンチパターンを回避する。

- **Big Bang Prompt**: 4 ファイルを 1 つの巨大プロンプトで一括生成しない。1 ファイルずつ TASK を分けて生成
- **Vibe Merge**: AC が pass していない状態で commit しない
- **Silent Scope Expansion**: File Scope 外（`templates/` や SAGE 内部物）への変更を含めない

## 契約

- API: なし
- DB: なし
- イベント: なし
- commit-msg hook: 各 commit に TASK-ID を含める（SAGE pre-commit hook で検証）
- File Scope hook: `check-file-scope.sh` が `standard` プロファイルで warn-only として動作（`.sage/config.yaml` `hooks.profile: standard`）

## リスク

- リスク1: ドキュメントが Phase 1 dogfooding を経ず確定すると現実と乖離する → 軽減策: 各ファイル冒頭に「Draft v0.1（Phase 1 後改訂）」を明記（AC-07 で機械検証）
- リスク2: 4 文書間の用語整合は機械検証できない範囲が残る → 軽減策: PLAN フェーズで共通用語集セクションの是非を判定
- リスク3: 4 文書のスコープが重複する（GWT と QA 技法の境界等）→ 軽減策: 各ファイル冒頭に「このファイルの守備範囲」と「隣接 doc への参照」を明記
- リスク4: 実装エージェントが gakuten 固有判断を混入する → 軽減策: AC-04 で機械ブロック + 実装エージェントへのプロンプトで「汎用ファースト」を強調
- リスク5: 主体 Notion 文書が変更される → 軽減策: ドキュメント末尾の出典セクションで Notion ページ ID と参照日時を記録

## 採用メトリクス（合格基準）

Phase 0 完了時点で本 SPEC が「正しく機能している」と判断する基準。

| メトリクス | 合格基準 | 計測方法 |
|---|---|---|
| ドキュメント存在 | 4 ファイル全存在 | AC-01 |
| 汎用性 | gakuten 固有語ゼロ | AC-04 |
| 用語整合 | 「形名参同」全 4 ファイルで使用 | AC-05 |
| ファイル長 | 各 100-600 行 | AC-06 |
| 主要概念カバー率 | Doc #1, #2, #3 の主要概念が全網羅 | AC-08 |
| dogfooding 採用率 | Phase 1 で実プロジェクト 2 件以上が改訂なし採用 | Phase 1 終了時に手動カウント |

dogfooding 採用率が 50% 未満（実プロジェクト 2 件中 1 件未満）の場合、SPEC を改訂する。

## 段階移行（昇格条件）

Phase 0 → Phase 1 の昇格条件と検証コマンド。

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| Phase 0 SPEC Draft → Phase 0 SPEC Approved | AC-01 〜 AC-08 全 pass + `/sage-evaluate` で 95+ | `bash scripts/sage-validate.sh && /sage-evaluate` |
| Phase 0 完了 → Phase 1 開始 | SPEC-0001 status: Approved + 4 ファイルすべて存在 + Notion 主体 4 文書（Doc #1, #2, #3, #28）から該当概念が抽出済み | `ls package-templates/docs/philosophy/*.md \| wc -l` で 4 を得る |
| Phase 1 → Phase 1 dogfooding 完了 | dogfooding 採用率 50%+ かつ failures.md エントリ 3 件以下 | `wc -l sage/failures.md` の手動レビュー |

## 実装メモ（Implementation Agent向け）

- 出典 Notion ページ:
  - `35b68c677f4380bfa1ffeab248264e92` — テストフロー再設計（親メモ、Test Pyramid・GWT・Locator 優先順位）
  - `c3e549660ca44005a20c4f6fdb54c8d5` — 無料で作る AI エージェント開発診断フロー（形名参同・ai:check）
  - `dc8774cd03c8490688b066c2b0179cac` — AI 駆動開発時代に押さえる QA 技法（同値分割・境界値・デシジョンテーブル・状態遷移・エラー推測）
- 4 ファイルは**独立かつ並列実装可能**。依存グラフなし。PLAN フェーズで 4 TASK に分割し、並列実装する
- 各ファイルの記述順序（推奨）:
  - `formal-name-match.md`: 概念定義 → 「名」と「形」の対応表 → AI 駆動開発での適用例 → 出典
  - `test-pyramid.md`: 各層の定義 → 責務分割表 → よくある失敗 → 出典
  - `given-when-then.md`: GWT 構文 → AI への指示パターン → 受け入れ条件への落とし方 → 出典
  - `qa-techniques.md`: 6 技法の定義 + AI 指示例 → 出典
- フレームワーク非依存にするため、コード例は擬似コードまたは最小限の TypeScript / pseudo-SQL に留める
- `package-templates/docs/philosophy/` ディレクトリは未作成。実装時に `mkdir -p` で作成する

## ロールバック手順

実装後に問題が発覚した場合の段階的ロールバック。

| 失敗レベル | ロールバック手順 |
|---|---|
| Level 1: 単一ファイルの内容不備（AC-02〜AC-08 失敗） | 該当ファイルのみ `git checkout HEAD -- package-templates/docs/philosophy/<file>.md` で復元、再実装 |
| Level 2: 複数ファイルの整合性破綻（AC-05, AC-08 失敗） | `git checkout HEAD -- package-templates/docs/philosophy/` で 4 ファイル一括復元、PLAN を再評価 |
| Level 3: SPEC レベルの方針誤り（dogfooding で全面乖離） | SPEC-0001 ステータスを `Draft` に戻し、新規 SPEC として再起票（SPEC-XXXX-philosophy-docs-v2） |

## Properties

### Invariants
- [INV-01] (Gate 4) 配布物 (`package-templates/`) と SAGE 内部物 (`templates/`, `.sage/`, `sage/`) は混在しない。本 SPEC で作成する 4 ファイルは `package-templates/docs/philosophy/` 配下にのみ存在する
- [INV-02] (Gate 4 / 横断) ドキュメント本文に gakuten 固有の語彙（プロジェクト名・apps 構造名・特定意思決定の理由）が含まれない
- [INV-03] (Gate 4) 配布物 SPEC の File Scope は `package-templates/` 配下のみ。SAGE 内部物・`CLAUDE.md` 等を実装時に変更しない

### Pre-conditions
- [PRE-01] (Gate 1) 実装開始時、`.sage/config.yaml` の `hooks.profile` が `standard` 以上で、`protect-sage-files` と `check-file-scope` が有効化されている

### Post-conditions
- [POST-01] (Gate 2) 4 ファイルが指定パスで存在し、各 H1 タイトルが日本語の概念名で始まる
- [POST-02] (Gate 2) 各ファイルが「## 出典」セクションを持ち、依拠する Notion ページ ID または記事タイトルを明示する
- [POST-03] (Gate 4) 4 ファイル全てが `package-templates/docs/philosophy/` 配下に存在し、他のディレクトリ（`templates/` 等）に類似ファイルが作成されていない

### Assumptions
- [ASM-01] (Gate 横断) SAGE Development System は本リポの開発手法であり、配布物 (`package-templates/`) には含まれない（`.gitignore` で SAGE 内部物は除外済み）
- [ASM-02] (Gate 横断) Notion 主体 4 文書のうち Supabase Testing 戦略（Doc #28）は本 SPEC のスコープ外。`test-pyramid.md` の責務分割表で「DB/RLS 層」を抽象的に言及するに留め、pgTAP / InBucket の具体は `supabase-rls` プロファイル系の別 SPEC で扱う

## 関連ID

- PLAN-ID: （計画フェーズで記入）
- TASK-ID: （分割フェーズで記入）
