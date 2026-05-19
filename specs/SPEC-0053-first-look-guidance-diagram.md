# SPEC-0053: First-Look Guidance Diagram

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0053 |
| ステータス | Done |
| 作成日    | 2026-05-19 |
| 更新日    | 2026-05-19 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0038 |
| 権限レベル | feature |

## 背景・目的

GitHub初見では `docs/usage-model.md` と `package-templates/prompts/README.md` の関係が分かりにくい。利用者が Local / Repair / E2E / CI / Review gate と各 prompt の対応を一目で把握できるよう、1枚絵と相互リンクを追加する。

## 対象ユーザー

- GitHubで初めてリポジトリを見る利用者
- prompt library をどの順番で使うべきか知りたい reviewer
- onboarding docs を案内する maintainer

## スコープ（含む）

- `docs/usage-model.md` に Mermaid 1枚絵を追加する
- `package-templates/prompts/README.md` に同じ語彙で prompt mapping を整理する
- README から usage model / prompts flow への導線を明確にする

## スコープ外（明示的に除外）

- repository directory restructure
- specs/plans/tasks の移動
- website / generated image creation
- npm package version bump / publish

## 要件

### 機能要件
- [FR-01] usage model に core loop と prompt mapping が1画面で分かる Mermaid diagram がある
- [FR-02] prompts README から usage model へリンクする
- [FR-03] README が「まず見る」導線として usage model と prompt flow を案内する

### 非機能要件
- [NFR-01] 既存 docs の語彙を崩さない
- [NFR-02] 画像 asset を追加しない

### セキュリティ要件
- [SEC-01] docs に secret / private Notion URL を追加しない

### 運用要件
- [OPS-01] `make validate` が pass
- [OPS-02] `git diff --check` が pass

## 受け入れ条件（Acceptance Criteria）

- [x] AC-01: `docs/usage-model.md` に `flowchart` diagram がある
- [x] AC-02: diagram に `plan-first.md`, `diagnostic-repair.md`, `security-scan.md`, `review-training.md` が含まれる
- [x] AC-03: `package-templates/prompts/README.md` が `docs/usage-model.md` へリンクする
- [x] AC-04: README / README-en が first-look 導線を含む
- [x] AC-05: `make validate` が pass

## 異常系

- Mermaid が表示されない環境: 直後の本文が同じ流れを説明する
- docs link が壊れる: relative link を existing path に限定する

## 契約

- API: なし
- DB: なし
- イベント: なし

## リスク

- docs が長くなる → 既存 sections に短い diagram とリンクだけを追加する

## 実装メモ（Implementation Agent向け）

既存 `docs/usage-model.md` の冒頭 core loop 近辺に diagram を入れ、prompts README の推奨利用フローと語彙を揃える。

## Properties

### Invariants
- [INV-01] (Gate 4) prompt names in diagram match actual filenames
- [INV-02] (Gate 4) links point to existing files

### Pre-conditions
- [PRE-01] (Gate 2) docs files exist

### Post-conditions
- [POST-01] (Gate 2) readers can follow first-look path from README to usage model to prompts README

### Assumptions
- [ASM-01] (Gate 横断) GitHub renders Mermaid in Markdown

## 関連ID

- PLAN-ID: PLAN-0053
- TASK-ID: TASK-0190

## 自動採点

```yaml
eval_feedback:
  target_file: "specs/SPEC-0053-first-look-guidance-diagram.md"
  target_type: SPEC
  verdict: PASS
  total_score: 100
  grade: "S++"
  subscores:
    codified_rules: "20/20"
    atomic_decomposition: "20/20"
    spec_driven_development: "20/20"
    observable_development: "20/20"
    knowledge_management: "15/15"
    gradual_adoption: "5/5"
  findings: []
  fix_instructions: []
```
