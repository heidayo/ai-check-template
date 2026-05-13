# SPEC-0003: ai:check 実行スタック（scripts / .claude / package.scripts.fragment.json）

## メタデータ

| フィールド | 内容 |
|-----------|------|
| SPEC-ID   | SPEC-0003 |
| ステータス | Approved |
| 作成日    | 2026-05-13 |
| 更新日    | 2026-05-13 |
| 担当Agent | Spec Agent |
| 依存SPEC  | SPEC-0001（philosophy が `formal-name-match.md` を提供）、SPEC-0002（ci-examples の YAML が `pnpm ai:check` を呼ぶ前提） |
| 権限レベル | platform |

## 背景・目的

`ai:check` / `ai:check:fast` を「AI 内部ループ（Edit hook = fast）+ PR Gate（Stop hook + CI = full）のハイブリッド」として実体化するための実行スタックを配布する。SPEC-0002 の CI YAML や SPEC-0001 の形名参同思想は本 SPEC の実体（scripts + npm scripts + hook）が揃って初めて機能する。

### 提供物の役割分担
- **`scripts/ai-check.sh` / `ai-check-fast.sh`**: 非 Node プロジェクトでも使える entry point。シェルで `pnpm ai:check` 等を呼ぶ薄いラッパー
- **`package.scripts.fragment.json`**: npm scripts の雛形（`ai:check` / `ai:check:fast` の中身）。利用者は自プロジェクトの `package.json` にマージする
- **`.claude/rules/test-rules.md`**: Playwright Locator 優先順位ルール（Claude Code / Codex が参照）
- **`.claude/settings.hook-fragment.json`**: Edit=fast / Stop=full のハイブリッド hook 設定の雛形

これらは互いに連携するが、利用者は **必要な部分だけ採用可能**（例: npm script のみ採用、hook はオフ）な疎結合設計とする。

## 対象ユーザー

- 本パッケージを利用して AI 駆動開発の `ai:check` ループを構築するエンジニア
- Claude Code / Codex を実装エージェントに使うチーム
- 非 Node プロジェクト（Python / Go / Rust 等）でも `ai:check.sh` を入口に使えるよう、シェルスクリプトも併せて提供

## スコープ（含む）

- `package-templates/scripts/ai-check.sh` を作成（full check 用、`pnpm ai:check` のシェルラッパー）
- `package-templates/scripts/ai-check-fast.sh` を作成（fast check 用、`pnpm ai:check:fast` のシェルラッパー）
- `package-templates/scripts/README.md` を作成（scripts/ ディレクトリの使い方）
- `package-templates/.claude/rules/test-rules.md` を作成（Playwright Locator 優先順位）
- `package-templates/.claude/settings.hook-fragment.json` を作成（Edit / Stop hook 雛形）
- `package-templates/.claude/README.md` を作成（hook 設定の組み込み手順）
- `package-templates/package.scripts.fragment.json` を作成（npm scripts 雛形）

合計 7 ファイル（5 配布物 + 2 README）。

## スコープ外（明示的に除外）

- 個別ツール（React Doctor / Knip / Semgrep 等）の解説 — 「tools 解説」は Phase 0 では作成せず、思想ドキュメントで代替（README.md の Phase 0 構造に tools/ は含まれていない）
- AI プロンプト雛形（`prompts/`）— 次の SPEC（prompts 系）で扱う
- プロファイル（`profiles/`）— その次の SPEC で扱う
- CI YAML（`ci-examples/`）— SPEC-0002 で完了済
- 思想ドキュメント（`docs/philosophy/`）— SPEC-0001 で完了済
- npm パッケージ実装（`bin/`, `src/`）— Phase 2
- 本リポ自身の `.claude/settings.json` 更新 — 配布物 vs リポ運用の分離
- gakuten 固有作業

## File Scope（SPEC レベル）

**書き込み許可:**
- `package-templates/scripts/ai-check.sh`
- `package-templates/scripts/ai-check-fast.sh`
- `package-templates/scripts/README.md`
- `package-templates/.claude/rules/test-rules.md`
- `package-templates/.claude/settings.hook-fragment.json`
- `package-templates/.claude/README.md`
- `package-templates/package.scripts.fragment.json`

**読み込みのみ:**
- `package-templates/docs/philosophy/*.md`（参照リンク先）
- `package-templates/ci-examples/`（YAML が呼ぶコマンドとの整合）
- `.claude/rules/ai-check-template.md`

**変更禁止:**
- 本リポ自身の `.claude/settings.json` / `.claude/rules/*-rules.md` / SAGE 内部物
- 既存 `specs/SPEC-{0001,0002}*.md` / `plans/PLAN-{0001,0002}*.md` / `tasks/TASK-000{1..10}*.md`
- `package-templates/docs/philosophy/*.md` / `package-templates/ci-examples/`
- 本リポの `package.json`（存在しないが、将来 Phase 2 で扱う）

## CLAUDE.md / .claude/rules/ 連携

実装エージェントは `.claude/rules/ai-check-template.md` を参照。本 SPEC は CLAUDE.md への追記なし。

| ルール | 出典 | 実装時の遵守事項 |
|---|---|---|
| 汎用ファースト | ai-check-template.md §設計原則1 | スクリプト・JSON は特定ツール（React Doctor 等）に固定せず、`pnpm <command>` を呼ぶ抽象に留める |
| 言語規約 | ai-check-template.md §言語規約 | スクリプト本体・JSON キーは英語、コメント・README は日本語 |
| 配布物と SAGE 内部物の分離 | ai-check-template.md §配布物と SAGE 内部物の分離 | `package-templates/.claude/` 配下のみ書き込み、本リポの `.claude/` は触らない |

## Forbidden Shortcuts（禁止事項）

- gakuten / 学生転職 / apps/web / web_ipo / academy / internships 等固有語の使用
- `pnpm` 以外の特定 PM に固定（コメントで「PM を差し替え可」を明示）
- secret / token / API key の直書き
- `--no-verify` / `--force` 等 SAGE hook bypass
- 本リポ自身の `.claude/settings.json` を上書き（配布物は別ファイル `settings.hook-fragment.json`）
- 本リポの `package.json` を生成・更新（Phase 2 で扱う）
- TODO / FIXME を残してコミット
- File Scope 外への書き込み
- スクリプトに `set -e` 等の安全ガードを入れ忘れる

## 要件

### 機能要件
- [FR-01] `scripts/ai-check.sh` が `pnpm ai:check` を呼び、終了コードを伝播する
- [FR-02] `scripts/ai-check-fast.sh` が `pnpm ai:check:fast` を呼び、終了コードを伝播する
- [FR-03] 両シェルスクリプトは `set -euo pipefail` で安全に書かれている
- [FR-04] 両シェルスクリプトは `PM` 環境変数で PM を上書き可能（デフォルト `pnpm`、`PM=npm bash ai-check.sh` で npm を使える）
- [FR-05] `package.scripts.fragment.json` が `ai:check` / `ai:check:fast` の `scripts` エントリを含む有効な JSON
- [FR-06] `.claude/settings.hook-fragment.json` が Edit / Stop hook を定義する有効な JSON
- [FR-07] `.claude/rules/test-rules.md` に Playwright Locator 優先順位 5 段階が記載されている
- [FR-08] 各ディレクトリ（`scripts/`, `.claude/`）に README が存在し、利用方法を説明
- [FR-09] スクリプト・JSON・README は互いに整合（例: hook が呼ぶコマンドと scripts/ シェルが呼ぶコマンドが対応）

### 非機能要件
- [NFR-01] シェルスクリプト 1 ファイル 10-50 行（薄いラッパー）
- [NFR-02] README 50-200 行
- [NFR-03] JSON ファイル 5-30 行（簡潔）
- [NFR-04] テスト種別: structural test（ファイル存在 + grep）+ syntax check（`bash -n` / JSON parse）。Unit / Integration / E2E は N/A（配布物のみ）
- [NFR-05] カバレッジ閾値: N/A — 実行ロジックは利用者プロジェクトに依存

### セキュリティ要件
- [SEC-01] シェルスクリプトに `eval` / `bash -c` 等の任意コード実行パターンを含めない（grep で機械検証）
- [SEC-02] JSON / シェル / README に secret / token / API key を直書きしない
- [SEC-03] hook 設定の `command` フィールドが過大権限を要求しない（`rm -rf`, `sudo` 等の禁止コマンドを含まない）

### 運用要件
- [OPS-01] 本 SPEC 完了後、Phase 0 サブ成果物 2/7 → 5/7（philosophy + ci-examples + 本 SPEC の execution stack）
- [OPS-02] dogfooding で `pnpm ai:check` 不在等のフィードバックを `sage/failures.md` に記録

## Quality Gate マッピング

| Gate | 対応 AC | 検証コマンド |
|---|---|---|
| Gate 1: Structural | AC-01..AC-04, AC-09, AC-10 | `ls`, `head`, `wc`, `bash -n`（構文検査） |
| Gate 2: Functional | AC-05, AC-06, AC-07, AC-08 | `grep` で各コマンド・キー呼び出しを確認 |
| Gate 3: Security | AC-11, AC-12 | `grep -iE` で `eval` / `rm -rf` / secret パターン不在 |
| Gate 4: Architecture | AC-13 | `find` でディレクトリ配置 |
| Gate 5: Release | N/A | Phase 0 では対象外 |

## 受け入れ条件（Acceptance Criteria）

### 正常系（存在・構造）
- [ ] AC-01: 7 ファイルすべて存在（`ls` で確認、`scripts/{ai-check.sh, ai-check-fast.sh, README.md}` + `.claude/{rules/test-rules.md, settings.hook-fragment.json, README.md}` + `package.scripts.fragment.json`）
- [ ] AC-02: 2 つのシェルスクリプトが `bash -n` で構文 pass
- [ ] AC-03: 2 つの JSON ファイルが `python3 -c "import json; ..."` または `jq empty` で構文 pass
- [ ] AC-04: 2 つの README が H1 タイトルを持つ

### 機能検証
- [ ] AC-05: `scripts/ai-check.sh` に `pnpm ai:check`（fast 以外）の呼び出しが存在（`grep -E "(\\$\\{?PM\\}? )?ai:check($|[^:])" package-templates/scripts/ai-check.sh` が match）
- [ ] AC-06: `scripts/ai-check-fast.sh` に `pnpm ai:check:fast` の呼び出しが存在
- [ ] AC-07: `package.scripts.fragment.json` が `ai:check` および `ai:check:fast` を `scripts` に持つ（`python3 -c "import json,sys; d=json.load(open('...')); assert 'ai:check' in d['scripts'] and 'ai:check:fast' in d['scripts']"`）
- [ ] AC-08: `.claude/settings.hook-fragment.json` が hook の `command` キーで `pnpm ai:check:fast` および `pnpm ai:check` の双方を含む（`grep -q "pnpm ai:check:fast"` + `grep -q "pnpm ai:check[^:]"`）
- [ ] AC-09: `.claude/rules/test-rules.md` に Playwright Locator 5 種が登場（`grep -cE "getByRole|getByLabel|getByText|getByTestId|locator" package-templates/.claude/rules/test-rules.md` が 5 以上）
- [ ] AC-10: 両シェルスクリプトが `set -euo pipefail` を持つ（`grep -l "set -euo pipefail" package-templates/scripts/*.sh | wc -l` が 2）

### 異常系（混入・欠落）
- [ ] AC-11: 危険コマンドが含まれない（`grep -E "(rm -rf|sudo|eval|bash -c)" package-templates/scripts/ package-templates/.claude/` が空、ただし README 内の説明テキストでは許容）
- [ ] AC-12: secret 直書きが存在しない（`grep -iE "(api[-_]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*['\"]" package-templates/scripts/ package-templates/.claude/ package-templates/package.scripts.fragment.json` が空、`${{ secrets.* }}` 形式は除外）
- [ ] AC-14: gakuten 固有語が含まれない（`grep -riE "gakuten|学生転職|apps/web|web_ipo|academy|internships" package-templates/scripts/ package-templates/.claude/ package-templates/package.scripts.fragment.json` が空）

### 配置検証（アーキテクチャ）
- [ ] AC-13: 全 7 ファイルが `package-templates/` 配下にのみ存在（本リポの `.claude/` や `scripts/` には新規ファイルが入っていない）

## 異常系

- 想定エラー1: JSON 構文エラー → AC-03 で機械検出
- 想定エラー2: シェル構文エラー → AC-02 で機械検出
- 想定エラー3: hook 設定キー名が Claude Code spec と乖離 → 出典 docs を引用して防ぐ
- 想定エラー4: gakuten 固有語混入 → AC-14 で機械検出
- 想定エラー5: 危険コマンド混入 → AC-11 で機械検出
- 境界ケース1: hook 設定の Stop event が将来 Claude Code で名前変更 → コメントで「Claude Code spec 2026-05 時点」と明示

## Error Resolution 手順

| 失敗 AC | エラー内容 | 復旧手順 |
|---|---|---|
| AC-01 | ファイル欠落 | 不足ファイルを `mkdir -p` + Write で作成 |
| AC-02 | シェル構文エラー | `bash -n` でエラー位置確認、該当箇所修正 |
| AC-03 | JSON 構文エラー | `jq .` でエラー位置確認、該当箇所修正 |
| AC-05/06 | ai:check 呼び出し欠落 | スクリプトに `$PM ai:check` 等を追加 |
| AC-07 | scripts キー欠落 | JSON の `scripts` に `ai:check` / `ai:check:fast` を追加 |
| AC-08 | hook command 欠落 | settings.hook-fragment.json に Edit / Stop hook を追加 |
| AC-09 | Locator 種類欠落 | test-rules.md に 5 種をリスト |
| AC-10 | `set -euo pipefail` 欠落 | スクリプト冒頭に追加 |
| AC-11 | 危険コマンド混入 | 該当箇所を削除 |
| AC-12 | secret 直書き | `${{ secrets.NAME }}` または環境変数に置換 |
| AC-13 | 誤配置 | `git mv` で `package-templates/` 配下に移動 |
| AC-14 | gakuten 固有語混入 | 汎用語に置換 |

連続 3 回同じ AC が失敗で `same_fail_abort`。

## Knowledge Management

| シナリオ | 記録先 | 責任者 | タイミング |
|---|---|---|---|
| `pnpm ai:check` が未定義のプロジェクトで CI が即 fail | `sage/failures.md` | リポオーナー | dogfooding 中 |
| hook 設定キー名が Claude Code 仕様と乖離 | `sage/failures.md` | リポオーナー | 仕様変更 awareness 時 |
| 危険コマンド混入が 3 回累積 | `sage/anti-patterns.md` 昇格候補 | オーナー | failures.md レビュー時 |

### sage/anti-patterns.md 参照
- **Big Bang Prompt**: 7 ファイルを 1 つのプロンプトで一括生成しない
- **Silent Scope Expansion**: 本リポの `.claude/settings.json` に書き込まない（配布物は別 fragment ファイル）
- **計画と実装の乖離**: 計画ドキュメント（`package-templates/README.md`）の構造と一致させる

## 契約

- API: なし
- DB: なし
- イベント: Claude Code hook spec（`Edit` / `Write` / `Stop` イベント）に依存。spec 変更時は本 SPEC を改訂
- commit-msg hook: TASK-ID 必須

## リスク

- リスク1: Claude Code hook spec が将来変更される → 軽減策: hook fragment にコメントで「Claude Code 2026-05 時点」と明示、参照リンク（公式 docs）を記録
- リスク2: `pnpm` 以外の PM で動かない → 軽減策: `PM` 環境変数で上書き可能（FR-04）、README で代替例を記載
- リスク3: 危険コマンドが README の説明テキストに紛れる → 軽減策: AC-11 の grep を「コードブロック内のみ」に narrow できれば理想（Phase 1 で改善検討）
- リスク4: hook が止まらず無限ループ → 軽減策: `pnpm ai:check:fast` を呼ぶだけの薄い実装、Stop hook の重複起動防止は Claude Code 本体機能に委ねる
- リスク5: dogfooding で「ai:check スクリプトが重い」フィードバック → 軽減策: scripts/ai-check-fast.sh で軽量版を用意済、`PM ai:check:fast` だけを別ループに

## 採用メトリクス（合格基準）

| メトリクス | 合格基準 | 計測方法 |
|---|---|---|
| ファイル存在 | 7 ファイル全存在 | AC-01 |
| 構文正しさ | sh / JSON 構文 pass | AC-02, AC-03 |
| 機能整合 | hook command と scripts のコマンドが対応 | AC-08（hook = `pnpm ai:check`）+ AC-05/06（script = `pnpm ai:check`） |
| セキュリティ | 危険コマンド / secret 不在 | AC-11, AC-12 |
| dogfooding 採用率（Phase 1） | 2 プロジェクト以上が改訂なしで採用 | 手動カウント |

採用率 50% 未満で SPEC 改訂。

## 段階移行（昇格条件）

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| SPEC Draft → Approved | AC-01..AC-14 全 pass + 自己採点 95+ | `bash scripts/sage-validate.sh` + 採点 |
| Phase 0 サブ成果物 2/7 → 5/7 | 本 SPEC + scripts/ + .claude/ + package.scripts.fragment.json | サブ成果物カウント |

## 実装メモ（Implementation Agent向け）

### 出典
- Notion Doc #2（`c3e549660ca44005a20c4f6fdb54c8d5`）の「## package.jsonに入れる推奨script」「## Codex / Claude Codeに渡す運用プロンプト」節
- Notion Doc #1（`35b68c677f4380bfa1ffeab248264e92`）の Playwright Locator 優先順位
- Claude Code Hooks 公式 docs（参照日 2026-05-13）

### 推奨実装骨格

#### `scripts/ai-check.sh`
```bash
#!/usr/bin/env bash
# ai-check.sh — full AI check pipeline entry point
# Pipes formal-name-match: 事前宣言「名」と実測「形」を一括照合。
set -euo pipefail
PM=${PM:-pnpm}
echo "Running: ${PM} ai:check"
${PM} ai:check
```

#### `scripts/ai-check-fast.sh`
```bash
#!/usr/bin/env bash
# ai-check-fast.sh — fast AI check (Static + Unit only)
set -euo pipefail
PM=${PM:-pnpm}
echo "Running: ${PM} ai:check:fast"
${PM} ai:check:fast
```

#### `package.scripts.fragment.json`
```json
{
  "scripts": {
    "ai:check": "pnpm typecheck && pnpm lint && pnpm test",
    "ai:check:fast": "pnpm typecheck && pnpm lint && pnpm test:unit"
  }
}
```

#### `.claude/settings.hook-fragment.json`
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "pnpm ai:check:fast" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "pnpm ai:check" }
        ]
      }
    ]
  }
}
```

#### `.claude/rules/test-rules.md`
```markdown
# Test Rules

## Playwright Locator 優先順位

1. getByRole（最優先）
2. getByLabel
3. getByText
4. getByTestId
5. locator(css)（最後の手段）

詳細: package-templates/docs/philosophy/test-pyramid.md
```

### TASK 分解の指針（PLAN で確定）

並列可能: 7 ファイルすべて独立。1 ファイル = 1 TASK（7 TASK）+ 検証 TASK（1）= 計 8 TASK。
ただし scripts/README.md と .claude/README.md は説明テキストで他ファイルへの参照を含むので、ファイル本体 TASK 完了後に書く方が安全 → README 系を後段に配置するか並列にするかは PLAN で判定。

## ロールバック手順

| 失敗レベル | ロールバック手順 |
|---|---|
| Level 1: 単一ファイル不備 | 該当ファイルのみ `git checkout HEAD -- <path>` で復元、TASK 再実行 |
| Level 2: 複数ファイル整合崩壊（hook と scripts のコマンド不一致等） | `git checkout HEAD -- package-templates/scripts/ package-templates/.claude/ package-templates/package.scripts.fragment.json` で復元、PLAN 再評価 |
| Level 3: SPEC レベル方針誤り（dogfooding で hook 設計が破綻） | SPEC-0003 を Draft に戻し、新規 SPEC で再起票 |

## Properties

### Invariants
- [INV-01] (Gate 4) 配布物は `package-templates/` 配下にのみ存在。本リポの `.claude/settings.json` / `scripts/` / `package.json` に書き込まない
- [INV-02] (Gate 3) スクリプトに任意コード実行パターン（`eval`, `bash -c`, `curl | sh` 等）が含まれない
- [INV-03] (Gate 3) JSON / シェル / README に secret 直書きなし
- [INV-04] (Gate 4 / 横断) hook が呼ぶコマンドと scripts/ シェルが呼ぶコマンドが対応（`pnpm ai:check` ⇄ `pnpm ai:check` / `pnpm ai:check:fast` ⇄ `pnpm ai:check:fast`）

### Pre-conditions
- [PRE-01] (Gate 1) SPEC-0001 が Approved（philosophy が存在）
- [PRE-02] (Gate 1) SPEC-0002 が Approved（ci-examples の YAML が同じコマンド `pnpm ai:check` を呼んでいる前提）

### Post-conditions
- [POST-01] (Gate 2) 7 ファイルが指定パスで存在
- [POST-02] (Gate 2) hook → scripts → npm scripts が同じ `ai:check` / `ai:check:fast` コマンドラインで結ばれる
- [POST-03] (Gate 4) `package-templates/.claude/` 配下と本リポの `.claude/` 配下が別物（実装中も後も混ざらない）

### Assumptions
- [ASM-01] (Gate 横断) `pnpm ai:check` の実体定義は `package.scripts.fragment.json` で提供する。利用者が自プロジェクトの `package.json` にマージする運用
- [ASM-02] (Gate 横断) Claude Code hook の `PostToolUse` / `Stop` イベント名は 2026-05 時点の公式 spec に従う
- [ASM-03] (Gate 横断) profiles/ で profile-specific な scripts / hook の上書きを扱う（別 SPEC）

## 関連ID

- 依存 SPEC: SPEC-0001, SPEC-0002
- PLAN-ID: PLAN-0003（次フェーズで確定）
- TASK-ID: TASK-0011..0018（PLAN で確定予定）
