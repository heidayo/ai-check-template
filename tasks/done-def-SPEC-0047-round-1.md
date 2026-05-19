# Done Definition: SPEC-0047 Round 1

## 対象

- SPEC-ID: SPEC-0047
- PLAN-ID: PLAN-0047
- TASK-ID: TASK-0179, TASK-0180, TASK-0181, TASK-0182, TASK-0183
- Round: 1

## 完了条件

### Structural Gate

- [x] `git diff --check` が pass する
- [x] TASK File Scope 外の変更がない
- [x] Codex 担当TASKと Claude Code 担当TASKの変更ファイルが重複しない
- [x] commit する場合、commit message に TASK-ID を含める

### Functional Gate

- [x] `node --test tests/cli/*.test.mjs` が pass する
- [x] `make validate` が pass する
- [x] CLI fixture lifecycle test が `init -> doctor -> update -> doctor --strict` の導入回帰を検出できる
- [x] README の最初の導入コマンドが推奨 dry-run path として読める

### Security Gate

- [x] `bash scripts/sage-validate.sh` が pass する
- [x] `rg "TODO|FIXME" README.md README-en.md docs package-templates/.claude package-templates/docs/philosophy/formal-name-match.md` が新規 unfinished marker を検出しない
- [x] secret / token / credential を README / docs / templates に追加していない
- [x] GitHub Actions permissions / pinning guidance を弱めていない

### Architecture Gate

- [x] `CLAUDE.md` / `.claude/` は Claude Code 担当TASK以外で変更しない
- [x] README / docs / tests は Codex 担当TASK以外で変更しない
- [x] Claude Code 文書は `docs/roadmap.md` / `docs/cli.md` を source of truth とし、古い Phase 固定表を持たない
- [x] root `CLAUDE.md` は npm package files に含まれていない

## Error Resolution

失敗が発生した場合:

1. 担当Agentが該当 TASK の実行ログに RUN-ID、失敗コマンド、結果 `Fail` を記録する。
2. `sage/anti-patterns.md` を確認する。
3. 新規失敗なら `sage/failures.md` に FAIL-XXXX 形式で記録する。
4. 同種失敗3回で `sage/anti-patterns.md` 昇格候補にする。
5. File Scope 外の修正が必要なら TASK を改訂してから再実行する。
