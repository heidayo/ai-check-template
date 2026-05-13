# SPEC-0005: package-templates/profiles/ 骨格整備

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0005 |
| ステータス | Approved |
| 作成日    | 2026-05-13 |
| 更新日    | 2026-05-13 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0001（philosophy）、SPEC-0003（execution stack、profile が scripts / .claude のカスタマイズ案を示す） |
| 権限レベル | platform |

## 背景・目的

`ai-check-template` の利用者は様々な技術スタック（Next.js / React vanilla / Expo / Node CLI / Supabase）を持つ。1 つの ai:check 設定で全てをカバーするのは無理があり、**プロファイル** として典型構成を 5 種類提供する。

Phase 0 では**骨格のみ**（各プロファイルの README）を提供する。具体的な scripts / hook / 設定ファイルの profile-specific な実体は Phase 1 dogfooding で精度を上げてから Phase 2 で CLI 統合する。

各 profile README は以下を扱う:
- profile の目的・対象スタック
- 推奨ツール構成（TS / lint / 診断 / Knip / Playwright / Semgrep の取捨選択）
- ai:check / ai:check:fast のカスタマイズ案
- 注意事項（例: expo-rn は React Doctor 非対応）

## 対象ユーザー

- プロジェクトの技術スタックに合った ai:check 構成を選びたいエンジニア
- 5 プロファイルのいずれかに合致するスタックを持つチーム
- Phase 1 dogfooding でプロファイル精度を上げたい人

## スコープ（含む）

- `package-templates/profiles/react-nextjs/README.md`
- `package-templates/profiles/react-vanilla/README.md`
- `package-templates/profiles/expo-rn/README.md`
- `package-templates/profiles/node-cli/README.md`
- `package-templates/profiles/supabase-rls/README.md`
- `package-templates/profiles/README.md`（インデックス）

合計 6 ファイル。

## スコープ外

- profile-specific な scripts / hook / 設定ファイルの実体 — Phase 1/2 で扱う
- CLI 経由でのプロファイル選択（`npx ai-check-template init --profile X`）— Phase 2
- profile 同士の組み合わせ（例: `react-nextjs+supabase-rls`）の merge ロジック — Phase 2
- gakuten 固有の設定（mobile app の特殊事情等）

## File Scope

**書き込み許可:**
- `package-templates/profiles/react-nextjs/README.md`
- `package-templates/profiles/react-vanilla/README.md`
- `package-templates/profiles/expo-rn/README.md`
- `package-templates/profiles/node-cli/README.md`
- `package-templates/profiles/supabase-rls/README.md`
- `package-templates/profiles/README.md`

**読み込みのみ:** `package-templates/{docs/philosophy, scripts, .claude, ci-examples, prompts, package.scripts.fragment.json}`

**変更禁止:** SAGE 内部物、既存 SPEC/PLAN/TASK、`package-templates/` の他 7 サブ成果物

## CLAUDE.md / .claude/rules/ 連携

| ルール | 実装時の遵守事項 |
|---|---|
| 汎用ファースト | profile は典型スタックの抽象であって、特定企業の事情ではない |
| 言語規約 | README は日本語、識別子は英語 |
| 配布物分離 | `package-templates/profiles/` のみ書き込み |

## Forbidden Shortcuts

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships の使用
- profile-specific な実体ファイル（settings.json 等）を Phase 0 で配置（Phase 1/2 で扱う）
- 5 profile の間で説明トーンが食い違う
- 各 profile が他 profile への参照リンクを持たない（孤立した README にしない）
- TODO / FIXME / XXX を残す
- File Scope 外への書き込み

## 要件

### 機能要件
- [FR-01] 6 ファイル全存在
- [FR-02] 各 profile README が H1 タイトル + 目的 + 対象スタック + 推奨ツール + カスタマイズ案 + 注意事項 + 出典の構造
- [FR-03] profiles/README.md がインデックスとして 5 profile すべての概要表を含む
- [FR-04] 各 profile が他 profile と本パッケージ思想ドキュメントへの相互リンクを持つ
- [FR-05] 各 profile が `package.scripts.fragment.json` / `.claude/settings.hook-fragment.json` / `scripts/` のカスタマイズ案を示す

### 非機能要件
- [NFR-01] profile README 1 ファイル 60-200 行
- [NFR-02] profiles/README.md 50-200 行
- [NFR-03] テスト種別: structural test + grep（実体ファイルなし、README のみ）
- [NFR-04] カバレッジ閾値: N/A — README のみ

### セキュリティ要件
- [SEC-01] secret / token / API key の直書きなし
- [SEC-02] 危険コマンド（`rm -rf`, `sudo`, `eval`）の例示なし

### 運用要件
- [OPS-01] 本 SPEC 完了で **Phase 0 全 7 サブ成果物完了** — Phase 1 dogfooding へ移行可能
- [OPS-02] dogfooding で「profile が現実と乖離」フィードバックを `sage/failures.md` に記録

## Quality Gate マッピング

| Gate | 対応 AC |
|---|---|
| Gate 1: Structural | AC-01..AC-04 |
| Gate 2: Functional | AC-05..AC-07 |
| Gate 3: Security | AC-09, AC-10 |
| Gate 4: Architecture | AC-11 |
| Gate 5: Release | N/A |

## 受け入れ条件

### 正常系
- [ ] AC-01: 6 ファイル全存在
- [ ] AC-02: 6 ファイル全てに H1 タイトル
- [ ] AC-03: 各 profile README に `## 出典` セクション（`grep -l "^## 出典" package-templates/profiles/*/README.md | wc -l` が 5）
- [ ] AC-04: profiles/README.md に `## 出典` セクション（インデックスファイル）

### 機能検証
- [ ] AC-05: profiles/README.md に 5 profile 名すべて登場（`grep -cE "react-nextjs|react-vanilla|expo-rn|node-cli|supabase-rls" package-templates/profiles/README.md` が 5 以上）
- [ ] AC-06: 各 profile README が philosophy への相互リンクを持つ（`grep -l "../../docs/philosophy" package-templates/profiles/*/README.md | wc -l` が 5）
- [ ] AC-07: 各 profile README が「推奨ツール」セクションを持つ（`grep -l "推奨ツール" package-templates/profiles/*/README.md | wc -l` が 5）

### 異常系
- [ ] AC-08: gakuten 固有語不在（`grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/profiles/` が空）
- [ ] AC-09: secret 直書きパターン不在
- [ ] AC-10: 危険コマンド例示不在（README で「禁止例」として登場するのは許容、AC は実行可能形を検出）

### 配置検証
- [ ] AC-11: profiles/ は `package-templates/` 配下のみ

## 異常系

- 想定エラー1: 5 profile のトーン不揃い → AC + 整合手動レビュー
- 想定エラー2: profile が現実のスタックと乖離（Next.js が App Router 前提だが利用者が Pages Router） → dogfooding feedback で改訂
- 想定エラー3: gakuten 固有語混入 → AC-08
- 境界ケース1: profile 名称（react-nextjs 等）が将来変更された場合 → 別 SPEC で対応

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | 不足ファイル作成 |
| AC-02 | H1 追加 |
| AC-03/04 | 出典セクション追加 |
| AC-05 | profile 名を README に追加 |
| AC-06 | philosophy リンク追加 |
| AC-07 | 「推奨ツール」セクション追加 |
| AC-08 | gakuten 固有語を汎用語に置換 |
| AC-09 | secret 削除 |
| AC-10 | 危険コマンドを禁止例として注記、または削除 |
| AC-11 | `git mv` で正しい配置に |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| profile が dogfooding で乖離 | `sage/failures.md` | リポオーナー |
| 同種乖離 3 回累積 | `sage/anti-patterns.md` 昇格候補 | リポオーナー |
| 新しい profile（例: rust-cli）の追加要望 | `sage/failures.md` を経由せず、新規 SPEC で対応 | オーナー |

### anti-patterns 参照
- **Big Bang Prompt**: 6 ファイルを 1 つのプロンプトで一括生成しない
- **Silent Scope Expansion**: profile から `package-templates/` 外への変更を禁止

## 契約

- API/DB/イベント: なし
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: 5 profile のスタック想定が利用者の実態と乖離 → 軽減策: dogfooding で 1 profile 1 プロジェクト以上の検証
- リスク2: profile-specific な実体ファイル不在のまま Phase 1 に入ると、利用者が「README しかない、何を使えばいいか分からない」状態に → 軽減策: README で「実体は Phase 2 で配布、現状は推奨構成のガイドのみ」と明示
- リスク3: profile 名が固定化され、後から変更困難 → 軽減策: 命名は技術スタック名称ベース（実態に応じて自然に変わりにくい）
- リスク4: 5 profile 間でカスタマイズ案がパターン化されず属人化 → 軽減策: 共通テンプレ構造を SPEC で固定

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| ファイル存在 | 6 ファイル全存在 |
| 5 profile カバレッジ | 全 5 profile に README |
| 汎用性 | gakuten 固有語ゼロ |
| dogfooding 採用率（Phase 1） | 各 profile 少なくとも 1 プロジェクトで検証 |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| SPEC Draft → Approved | AC-01..AC-11 全 pass + 95+ 採点 |
| Phase 0 サブ成果物 4/7 → **7/7（完了）** | SPEC-0005 Approved |
| Phase 0 完了 → Phase 1 開始 | Phase 0 全 7 サブ成果物 Approved |

## 実装メモ

### 各 profile の想定スタック

| profile | 対象 | 主な特徴 |
|---|---|---|
| `react-nextjs` | Next.js App Router + TS | フル toolchain（TS / oxlint / RD / Knip / Playwright / Semgrep） |
| `react-vanilla` | 純 React + TS（Vite / CRA 等） | Next.js なし、Playwright 任意 |
| `expo-rn` | Expo / React Native | **React Doctor 非対応**、Playwright 代替（Maestro 等を README で言及） |
| `node-cli` | Node CLI / Library | UI なし、Vitest / oxlint 中心、Playwright 不要 |
| `supabase-rls` | Supabase + RLS（他 profile に追加適用） | pgTAP, InBucket, service_role 落とし穴の注意 |

`supabase-rls` は他 profile と組み合わせて使う前提（Phase 2 で `--profile react-nextjs+supabase-rls` 形式）。

### 共通テンプレ構造

```markdown
# <profile 名>

> ステータス: Draft v0.1（Phase 1 dogfooding 後に改訂予定）

## 目的
（誰向け・何を解決するか）

## 対象スタック
（具体的なフレームワーク・ライブラリ・バージョン目安）

## 推奨ツール
| ツール | 必須/推奨/任意 | 用途 |
|---|---|---|

## ai:check / ai:check:fast カスタマイズ案
（package.scripts.fragment.json のカスタマイズ）

## .claude / scripts カスタマイズ案
（必要な場合のみ）

## 注意事項
（profile 固有の落とし穴）

## 隣接 profile
（他 profile への参照）

## 出典
```

### TASK 分解の指針

- TASK-A: 5 profile README をまとめて作成（同パターンで並列生成）
- TASK-B: profiles/README.md（インデックス）
- TASK-C: AC 検証

## ロールバック手順

| Level | 手順 |
|---|---|
| Level 1 | 該当ファイルのみ復元 |
| Level 2 | `git checkout HEAD -- package-templates/profiles/` で一括復元 |
| Level 3 | SPEC を Draft に戻し再起票 |

## Properties

### Invariants
- [INV-01] (Gate 4) 6 ファイルすべて `package-templates/profiles/` 配下にのみ存在
- [INV-02] (Gate 4 / 横断) gakuten 固有語不在
- [INV-03] (Gate 3) secret / 危険コマンドの直書き / 例示不在

### Pre-conditions
- [PRE-01] (Gate 1) SPEC-0001（philosophy）が Approved
- [PRE-02] (Gate 1) SPEC-0003（execution stack）が Approved（profile が scripts / hook のカスタマイズ案を示す前提）

### Post-conditions
- [POST-01] (Gate 2) 6 ファイル存在 + 各 profile README が共通テンプレ構造に従う
- [POST-02] (Gate 4) profiles/ 配下のみに存在、templates/ 等に複製なし
- [POST-03] (Gate 2) profiles/README.md が 5 profile のインデックスとして機能

### Assumptions
- [ASM-01] profile 実体ファイル（scripts / hook の specific 版）は Phase 1/2 で扱う。本 SPEC は README のみ
- [ASM-02] supabase-rls は他 profile と組み合わせる前提（spcific profile というより addon）
- [ASM-03] 各 profile は典型スタックの抽象であり、実プロジェクトの細部は利用者がカスタマイズする

## 関連ID

- 依存 SPEC: SPEC-0001, SPEC-0003
- PLAN-ID: PLAN-0005
- TASK-ID: TASK-0019..0021
