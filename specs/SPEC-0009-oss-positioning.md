# SPEC-0009: OSS positioning（README 刷新 + .github 導線 + ガバナンス）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0009 |
| ステータス | Approved |
| 作成日    | 2026-05-13 |
| 更新日    | 2026-05-14 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0001..0008（Phase 0 + SAGE 整備 + Phase 1 protocol） |
| 権限レベル | platform |

## 背景・目的

現状の README.md は **内向き**（Phase 表 / 提供物 / 段階）であり、外部の人が「このリポは何で、なぜ価値があり、どう試せるか」を一瞬で理解できない。スター 0 / フォーク 0 / Release 未公開という状態は、OSS としての価値が伝わっていない初期フェーズに相当する。

レビュー（コミュニティ視点）の核心:
- 「思想の完成」ではなく「他人が見て、なるほど使いたいと思える最小体験」を作る
- OSS の一言価値を **AI-generated code should not be trusted by default. This project provides templates to verify, repair, and safely merge AI-generated code.** に固定
- パッケージ化（npm CLI）は**後回し**。まず README 刷新と Issue / Contribution 導線を作って v0.1.0 を切る

本 SPEC は OSS positioning の最初の PR（レビュー §直近でやるべきこと §僕なら次の PR はこれにします）に対応する。`README 刷新 + docs/vision.md + docs/roadmap.md + .github テンプレ群 + CONTRIBUTING / CODE_OF_CONDUCT / SECURITY` を整備する。

## 対象ユーザー

- **外部開発者**（OSS を見つけて評価する人、コントリビュータ候補）
- **既存利用者**（社内 / dogfooding 関係者、刷新後も困らないように README-ja.md で日本語版を保持）
- **Issue 起票者**（テンプレに従って質問・要望・バグを記録）

## スコープ（含む）

### ルート
- `README.md` を**英語 Primary** で全面刷新（What / Why / Core loop / What you get / Quick start / Profiles / Roadmap / Contributing / License）
- `README-ja.md` を**日本語版**として作成（README.md の翻訳 + 文化的補足）
- `LICENSE`（既存 Apache-2.0、unchanged）

### docs/
- `docs/vision.md`（英語）— OSS の思想・解決したい課題・スコープ外
- `docs/roadmap.md`（英語）— v0.1.0 / v0.2.0 / v0.3.0+ のマイルストーン

### .github/
- `.github/ISSUE_TEMPLATE/bug_report.md`（英語）
- `.github/ISSUE_TEMPLATE/feature_request.md`（英語）
- `.github/ISSUE_TEMPLATE/template_request.md`（英語、本リポ特有：「こういうテンプレが欲しい」要望用）
- `.github/ISSUE_TEMPLATE/config.yml`（blank issue disable + リンク誘導）
- `.github/PULL_REQUEST_TEMPLATE.md`（日本語、SAGE 運用に合わせた構造：概要 / 変更内容 / 確認手順 / 影響範囲 / Promotion / リスクとロールバック / チェックリスト）

### ガバナンスドキュメント
- `CONTRIBUTING.md`（英語、貢献方法・PR フロー・SAGE 規律の薄い説明）
- `CODE_OF_CONDUCT.md`（英語、Contributor Covenant 標準）
- `SECURITY.md`（英語、脆弱性報告の方法）

合計 **12 ファイル**（README.md 更新 + README-ja.md + 10 新規）。

## スコープ外

- GitHub Actions 拡充（reusable workflow 等）— SPEC-0010 で扱う
- examples/nextjs-basic — SPEC-0011 で扱う
- npm パッケージ化（`bin/`, `src/`, `package.json` の npm 化）— v0.2.0 以降
- 配布物（`package-templates/`）への変更
- SAGE 管理ファイル（`sage/`, `templates/hooks/` 等）の変更
- 既存 `docs/phase-1-*` ドキュメントの変更
- 既存 `specs/` `plans/` `tasks/` の改変
- GitHub Marketplace Action（Stage 3、v0.3.0 以降）
- 実際の v0.1.0 tag 切り（SPEC-0014）

## File Scope

**書き込み許可:**
- `README.md`（既存更新）
- `README-ja.md`（新規）
- `docs/vision.md`（新規）
- `docs/roadmap.md`（新規）
- `.github/ISSUE_TEMPLATE/bug_report.md`（新規）
- `.github/ISSUE_TEMPLATE/feature_request.md`（新規）
- `.github/ISSUE_TEMPLATE/template_request.md`（新規）
- `.github/ISSUE_TEMPLATE/config.yml`（新規）
- `.github/PULL_REQUEST_TEMPLATE.md`（新規）
- `CONTRIBUTING.md`（新規）
- `CODE_OF_CONDUCT.md`（新規）
- `SECURITY.md`（新規）

**変更禁止:** SAGE 管理ファイル全般、配布物（`package-templates/`）、既存 SPEC/PLAN/TASK、`docs/phase-1-*`、`CLAUDE.md`、`.sage/`、`sage/`。

## CLAUDE.md / .claude/rules/ 連携

| ルール | 実装時の遵守事項 |
|---|---|
| 言語規約 | README 等外部向けは英語 Primary、`README-ja.md` 別建てで日本語版。`docs/vision.md` / `docs/roadmap.md` / `.github/ISSUE_TEMPLATE/**` / `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md` / `SECURITY.md` は英語。`.github/PULL_REQUEST_TEMPLATE.md` は maintainers の運用に合わせて日本語 |
| 汎用ファースト | OSS 価値命題に gakuten 等の固有プロジェクト名を含めない。日本語版でも一般化された記述 |
| Protected files | `CLAUDE.md` / `.sage/config.yaml` / `sage/*` は本 SPEC で変更しない |

## Forbidden Shortcuts

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等特定プロジェクト固有語の使用
- 過剰な訴求（「最強」「完璧」「絶対」等の保証表現）
- 既存配布物の URL 直リンクで gakuten 固有内容にリンク
- secret / token / API key の含有
- TODO / FIXME を残す
- 既存 SAGE / 配布物の改変
- v0.1.0 / Release tag を本 SPEC で切る（別 SPEC）
- README.md の Apache-2.0 ライセンス記述を削除

## 要件

### 機能要件

- [FR-01] 12 ファイル全存在（既存 `README.md` 更新 + 11 新規）
- [FR-02] `README.md` が外部訴求構造を持つ:
  - H1 + 一言価値（英語）
  - "What is this?" セクション
  - "Why?" セクション
  - "Core loop" セクション（思想ループ図解）
  - "What you get" セクション（提供物リスト）
  - "Quick start" セクション（コピペで試せる最小手順）
  - "Supported profiles" セクション
  - "Roadmap" セクション（外向け、Phase ではなく v0.1 / v0.2 / v0.3）
  - "Contributing" セクション（CONTRIBUTING.md への誘導）
  - "License" セクション（Apache-2.0）
  - "Japanese version" セクション（README-ja.md への誘導）
- [FR-03] `README-ja.md` が README.md の構造を踏襲した日本語版
- [FR-04] `docs/vision.md` が OSS 思想を 100-300 行で記述
- [FR-05] `docs/roadmap.md` が v0.1.0 / v0.2.0 / v0.3.0+ のマイルストーンを列挙
- [FR-06] `.github/ISSUE_TEMPLATE/` に bug / feature / template_request の 3 種 + config.yml
- [FR-07] `.github/PULL_REQUEST_TEMPLATE.md` に 概要 / 変更内容 / 確認手順 / 影響範囲 / Promotion / リスクとロールバック / チェックリスト の 7 セクション
- [FR-08] `CONTRIBUTING.md` が PR の流れ・SAGE 規律の薄い説明・lite/standard レーンの選び方を含む
- [FR-09] `CODE_OF_CONDUCT.md` が Contributor Covenant v2.1 ベース
- [FR-10] `SECURITY.md` が脆弱性報告連絡先 + 対応 SLO を含む

### 非機能要件

- [NFR-01] `README.md`: 100-300 行（短く尖らせる）
- [NFR-02] `README-ja.md`: 100-400 行（日本語は若干長くなる）
- [NFR-03] `docs/vision.md`: 100-300 行
- [NFR-04] `docs/roadmap.md`: 50-200 行
- [NFR-05] `.github/ISSUE_TEMPLATE/*.md`: 各 20-80 行
- [NFR-06] `.github/PULL_REQUEST_TEMPLATE.md`: 30-100 行
- [NFR-07] `CONTRIBUTING.md`: 80-300 行
- [NFR-08] `CODE_OF_CONDUCT.md`: 60-200 行（Contributor Covenant 標準）
- [NFR-09] `SECURITY.md`: 30-100 行
- [NFR-10] テスト種別: structural test（ファイル存在 + grep）
- [NFR-11] カバレッジ閾値: N/A

### セキュリティ要件

- [SEC-01] secret / token / 個人情報の直書きなし（grep 検証）
- [SEC-02] `SECURITY.md` の脆弱性報告連絡先は公開可能なアドレス（個人 email 直書き禁止、GitHub Security Advisories 利用を推奨）

### 運用要件

- [OPS-01] 本 SPEC 完了後、外部の人が GitHub リポにアクセスして「何のリポか」を 30 秒以内に判断可能
- [OPS-02] Issue / PR テンプレートが整備され、外部からの貢献を受け入れる準備が整う
- [OPS-03] v0.1.0 リリースへの前段が揃う（残りは SPEC-0010..0014）

## Quality Gate マッピング

| Gate | 対応 AC |
|---|---|
| Gate 1: Structural | AC-01..AC-06 |
| Gate 2: Functional | AC-07..AC-10 |
| Gate 3: Security | AC-11, AC-12 |
| Gate 4: Architecture | AC-13 |
| Gate 5: Release | N/A（v0.1.0 tag は SPEC-0014） |

## 受け入れ条件

### 正常系
- [x] AC-01: 12 ファイル全存在（`ls README.md README-ja.md docs/vision.md docs/roadmap.md .github/ISSUE_TEMPLATE/{bug_report,feature_request,template_request}.md .github/ISSUE_TEMPLATE/config.yml .github/PULL_REQUEST_TEMPLATE.md CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md`）
- [x] AC-02: `README.md` の H1 が英語タイトル（`head -1 README.md | grep -E "^# .*[a-zA-Z]"`）
- [x] AC-03: `README-ja.md` の H1 が日本語を含む（`head -1 README-ja.md | grep -qE "[ぁ-ん|ァ-ン|一-龯]"`）
- [x] AC-04: README.md が必須 10 セクションすべて含む（`for s in "What is this" "Why" "Core loop" "What you get" "Quick start" "Profiles" "Roadmap" "Contributing" "License" "README-ja"; do grep -qi "$s" README.md || exit 1; done`）
- [x] AC-05: `docs/vision.md` と `docs/roadmap.md` が H1 タイトルを持つ
- [x] AC-06: 各ファイル行数が NFR-01..NFR-09 の範囲内

### 機能検証
- [x] AC-07: `README-ja.md` への参照が `README.md` にある（`grep -q "README-ja.md" README.md`）
- [x] AC-08: `CONTRIBUTING.md` が PR テンプレへ言及（`grep -qE "PULL_REQUEST_TEMPLATE|SAGE|TASK-ID" CONTRIBUTING.md`）
- [x] AC-09: `SECURITY.md` が脆弱性報告手段を明示（`grep -qE "Security Advisor|vulnerability|report" SECURITY.md`、または日本語の場合は適宜）
- [x] AC-10: `.github/PULL_REQUEST_TEMPLATE.md` が 7 必須セクション含む（`for s in "概要" "変更内容" "確認手順" "影響範囲" "Promotion" "リスクとロールバック" "チェックリスト"; do grep -q "$s" .github/PULL_REQUEST_TEMPLATE.md || exit 1; done`）

### 異常系
- [x] AC-11: gakuten 固有語が含まれない（`grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" README.md README-ja.md docs/vision.md docs/roadmap.md .github/ CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md` が空）
- [x] AC-12: secret 直書き不在（`grep -riE "(api[-_]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*['\"]" README.md README-ja.md docs/vision.md docs/roadmap.md .github/ CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md` が空）

### 配置検証
- [x] AC-13: 変更ファイルが本 SPEC スコープのみ（`git status --short` の結果が 12 ファイル + SAGE artifacts のみ、配布物 / SAGE 内部物に変更なし）

## 異常系

- 想定エラー1: README.md が日本語のままで英語訴求になっていない → AC-02 + 手動レビュー
- 想定エラー2: README-ja.md が README.md の構造から乖離 → 手動レビュー
- 想定エラー3: gakuten 固有語混入 → AC-11
- 想定エラー4: Issue テンプレが内向きで外部利用者を考慮していない → 手動レビュー
- 境界ケース1: Contributor Covenant の翻訳問題（CODE_OF_CONDUCT.md）→ 公式英語版そのままを採用、日本語版は将来 SPEC で追加
- 境界ケース2: SECURITY.md の連絡先（個人 email vs GitHub Security Advisories）→ Advisories を Primary に

## Error Resolution

| 失敗 AC | 復旧手順 |
|---|---|
| AC-01 | 不足ファイル作成 |
| AC-02 | README.md の H1 を英語タイトルに変更 |
| AC-03 | README-ja.md の H1 を日本語に |
| AC-04 | 不足セクションを README.md に追加 |
| AC-05 | docs/{vision,roadmap}.md の H1 追加 |
| AC-06 | 行数を範囲内に調整（過少なら充実、過多なら圧縮） |
| AC-07 | README.md に README-ja.md への参照追加 |
| AC-08 | CONTRIBUTING.md に PR テンプレ / SAGE 言及追加 |
| AC-09 | SECURITY.md に脆弱性報告手段追加 |
| AC-10 | PULL_REQUEST_TEMPLATE.md に 7 セクション追加 |
| AC-11 | gakuten 固有語を汎用語に置換 |
| AC-12 | secret 直書きを削除 |
| AC-13 | 余分な変更ファイルを `git checkout HEAD -- <file>` |

## Knowledge Management

| シナリオ | 記録先 | 責任者 |
|---|---|---|
| 英語版 README に翻訳ミス / 不自然な表現 | `sage/failures.md` | リポオーナー |
| 日本語版と英語版の内容乖離（更新時） | `sage/failures.md` → 3 回累積で `sage/anti-patterns.md` 昇格候補 | リポオーナー |
| Issue テンプレが外部利用者の質問パターンに合わない | `sage/failures.md`、テンプレ改訂 SPEC | リポオーナー |
| SECURITY.md の連絡先が機能しない | 即時 SECURITY.md 改訂、SPEC 起票で恒久対応 | リポオーナー |

### anti-patterns 参照
- **Big Bang Prompt**: 12 ファイルを 1 つのプロンプトで一括生成しない
- **Silent Scope Expansion**: SAGE 管理ファイル / 配布物への拡散禁止
- **計画と実装の乖離**: README に「v0.1.0 リリース予定」と書いておきながら Release を切らない、等

## 契約

- API/DB/イベント: なし
- commit-msg hook: TASK-ID 必須
- GitHub Issue Template Form / Markdown: GitHub spec に従う
- Contributor Covenant v2.1: 公式テキストを採用

## リスク

- リスク1: 英語版 README の表現が不自然 / 文法エラー → 軽減策: 一次資料（レビュー本文の英語コピー例）を出発点、後で英語 native speaker のレビュー SPEC を別途検討
- リスク2: 英語版 / 日本語版の同期維持コスト → 軽減策: `CONTRIBUTING.md` で「英語 Primary、日本語は best effort で同期」と明記
- リスク3: Issue テンプレが既存利用者（日本語話者）に負担 → 軽減策: Issue テンプレは英語だが回答は日本語可、PR テンプレは maintainer 運用に合わせて日本語
- リスク4: Contributor Covenant 採用で社内文化との齟齬 → 軽減策: 公式英語版を採用、組織独自の条項は将来 SPEC で追加
- リスク5: README が長文すぎて訴求力が落ちる → 軽減策: NFR-01 で 300 行上限、Quick start を上部に配置

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| ファイル存在 | 12 ファイル全存在 |
| README 構造 | 10 必須セクション存在 |
| ガバナンス文書 | CONTRIBUTING / CODE_OF_CONDUCT / SECURITY の 3 つ |
| .github 導線 | Issue 3 種 + PR テンプレ + config.yml の 5 ファイル |
| 副作用 | 配布物 / SAGE 管理ファイルに変更なし |

## 段階移行

| 移行 | 昇格条件 |
|---|---|
| SPEC Draft → Approved | AC-01..AC-13 全 pass + 95+ 採点 |
| OSS positioning 完了 | SPEC-0009 Approved |
| v0.1.0 リリース準備 | SPEC-0009..0013 すべて Approved + SPEC-0014 で tag 切り |

## 実装メモ

### README.md（英語 Primary）の推奨構造

```markdown
# ai-check-template

**AI-generated code should not be trusted by default.**

ai-check-template provides reusable templates for verifying, repairing, and safely merging AI-generated code.

It helps teams move from:

> "AI implemented it."

to:

> "AI implemented it, checks passed, risks are visible, and humans can accept it with evidence."

[日本語版 / Japanese: README-ja.md](./README-ja.md)

## What is this?
（一文で）

## Why?
（背景：AI 駆動開発の検証ギャップ）

## Core loop
（思想ループ図解）
```
Requirement → Acceptance Criteria → Test Design → AI Implementation → Quality Check → Repair → Re-check → Human Acceptance
```

## What you get
- Test design philosophy (Formal Name Match, Test Pyramid, GWT, QA techniques)
- AI prompt templates (decision-table / state-transition / boundary-value / rls-permission / plan-first)
- ai:check execution stack (scripts + npm scripts fragment + Claude Code hooks)
- GitHub Actions CI examples
- 5 profiles (Next.js / vanilla React / Expo / Node CLI / Supabase RLS)

## Quick start
（コピペで試せる最小手順）

## Supported profiles
（5 profile の概要表）

## Roadmap
- v0.1.0: Manual templates for AI code verification
- v0.2.0: CLI (`npx ai-check-template init`)
- v0.3.0+: Composite Action / Marketplace listing

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License
[Apache-2.0](./LICENSE)
```

### docs/vision.md の主旨

- AI 駆動開発における「検証ギャップ」問題の定義
- 形名参同を中核とする思想
- 「品質ゲート」と「形名照合」の役割
- スコープ外（AI の代替・LLM の改良等）

### docs/roadmap.md の主旨

- v0.1.0 / v0.2.0 / v0.3.0+ のマイルストーン
- 各バージョンのスコープ・成果物・条件
- contributor が見て関与しやすいよう Issue ラベル / area への誘導

### .github/PULL_REQUEST_TEMPLATE.md の構造

```markdown
## 概要
- このPRで何を変更したかを簡潔に記載

## 変更内容
- [ ] 機能追加
- [ ] バグ修正
- [ ] ドキュメント更新
- [ ] リファクタ
- [ ] SAGE governance
- [ ] その他

## 確認手順
1.
2.
3.

## 影響範囲
- 画面:
- API:
- DB:
- インフラ:

## Promotion (promote/* のみ)
- [ ] Retro-SPEC 作成・レビュー済み
- [ ] TBD 全解消
- [ ] テスト追加済み

## リスクとロールバック
- 想定リスク:
- ロールバック手順:

## チェックリスト
- [ ] ブランチ命名規則に従っている
- [ ] コミットメッセージ規約に従っている
- [ ] CIが通過している
- [ ] File Scope 内の変更
- [ ] TODO/FIXME なし
- [ ] `make validate` pass
- [ ] Gate 誤検知があった場合 `sage/failures.md` に記録済み
- [ ] レビュー観点をPR本文に記載した
```

### TASK 分解の指針

- TASK-A: `README.md` 刷新 + `README-ja.md` 作成
- TASK-B: `docs/vision.md` + `docs/roadmap.md`
- TASK-C: `.github/ISSUE_TEMPLATE/` 4 ファイル + `PULL_REQUEST_TEMPLATE.md`
- TASK-D: `CONTRIBUTING.md` + `CODE_OF_CONDUCT.md` + `SECURITY.md`
- TASK-E: AC 検証

5 TASK。並列性を確保。

## ロールバック手順

| Level | 手順 |
|---|---|
| Level 1 | 該当ファイル個別 `git checkout HEAD -- <file>` で復元 |
| Level 2 | 12 ファイル一括復元 |
| Level 3 | SPEC を Draft に戻し再起票（OSS positioning 方針の再検討） |

## Properties

### Invariants
- [INV-01] (Gate 4) 変更は本 SPEC のスコープに列挙されたファイルのみ
- [INV-02] (Gate 4 / 横断) gakuten 固有語が含まれない
- [INV-03] (Gate 3) secret / token / 個人 email の直書きなし
- [INV-04] (Gate 4) `README.md` は英語 Primary、`README-ja.md` は日本語版、両者は構造的に対応

### Pre-conditions
- [PRE-01] (Gate 1) Phase 0 全 SPEC（SPEC-0001..0006）が Approved
- [PRE-02] (Gate 1) SPEC-0007 で CLAUDE.md / .sage 整備済

### Post-conditions
- [POST-01] (Gate 2) 12 ファイル存在 + 必須セクション含有
- [POST-02] (Gate 4) 配布物 / SAGE 管理ファイル unchanged
- [POST-03] (Gate 2) README.md ⇄ README-ja.md 相互リンクが機能

### Assumptions
- [ASM-01] 英語 README の表現は将来の SPEC で native speaker レビューを別途実施前提
- [ASM-02] Contributor Covenant v2.1 は公式英語版を採用、日本語訳は将来 SPEC で
- [ASM-03] SECURITY.md の連絡先は GitHub Security Advisories を Primary、必要に応じて個人 email を補助的に追加可

## 関連ID

- 依存 SPEC: SPEC-0001..0008
- 後続 SPEC（計画）: SPEC-0010（GitHub Actions 強化）, SPEC-0011（examples/nextjs-basic）, SPEC-0012（テスト設計テンプレ + 診断プロンプト追加）, SPEC-0013（dogfooding 公開）, SPEC-0014（v0.1.0 tag）
- PLAN-ID: PLAN-0009
- TASK-ID: TASK-0029..0033
