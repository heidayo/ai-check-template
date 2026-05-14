# PLAN-0015: CLI init foundation plan

## メタデータ

| フィールド | 内容 |
|-----------|------|
| PLAN-ID   | PLAN-0015 |
| SPEC-ID   | SPEC-0015 |
| ステータス | Completed |
| 作成日    | 2026-05-14 |
| 担当Agent | Planning Agent |

## 変更レイヤ

- [x] controller
- [x] usecase
- [x] domain
- [x] infrastructure
- [ ] frontend
- [x] infra
- [x] test
- [x] documentation

## 影響範囲

| 対象 | 影響 |
|---|---|
| `package.json` | alpha package metadata, `bin`, and Node test scripts を追加 |
| `bin/ai-check-template.mjs` | executable entrypoint を追加 |
| `src/cli/*.mjs` | command parser, init operation, profile validation, file utilities を追加 |
| `tests/cli/init.test.mjs` | init behavior, dry-run, overwrite safety, invalid profile, CI / Claude options を検証 |
| `docs/cli.md` | CLI alpha usage と safety behavior を文書化 |
| `README.md` / `README-ja.md` / `docs/roadmap.md` | CLI alpha docs への導線を追加 |
| `Makefile` | `make validate` に CLI tests を追加 |

## 実装方針

### 採用案

1. Node.js 標準ライブラリのみで CLI を実装する
2. `init` command は target `package.json` の存在を precondition とし、既存 project にだけ導入する
3. `package-templates/**` は read-only source として扱い、配布テンプレート自体は変更しない
4. default は no overwrite とし、conflict は skip report にする
5. `--dry-run` は同じ planning logic を通すが write path を実行しない
6. tests は CLI を child process として実行し、user-facing contract を black-box で検証する

### 不採用案

- npm publish: SPEC-0015 の scope 外
- dependency-based CLI framework: install 不要の validation を維持したい
- interactive prompt: alpha foundation では非対話実行に限定する
- profile-specific template mutation: follow-up SPEC に分離する

## Codified Rules

- Standard lane として SPEC-0015 / PLAN-0015 / TASK-0056..0060 に従う
- File Scope は各 TASK の `File Scope（変更許可範囲）` を source of truth にする
- `CLAUDE.md` / `.claude/**` / `sage/**` / `.sage/**` / `templates/**` は変更しない
- commit message には `TASK-0056`..`TASK-0060` を含める
- `make validate`, `node --test tests/cli/*.test.mjs`, `bash scripts/sage-validate.sh` を Gate として使う
- `--no-verify`, `--force`, `rm -rf`, npm publish, dependency 追加を禁止する

## タスク分解

| TASK-ID | 責務 | 担当Agent | 見積 | 依存TASK | 並列可否 |
|---------|------|----------|------|---------|---------|
| TASK-0056 | CLI package skeleton | Implementation | 35m | none | Yes |
| TASK-0057 | Init operations and safe merge | Implementation | 55m | TASK-0056 | No |
| TASK-0058 | CLI tests and documentation | Implementation / Test | 55m | TASK-0056, TASK-0057 | No |
| TASK-0059 | Validation wiring and AC checks | Test | 35m | TASK-0058 | No |
| TASK-0060 | Final verification, scoring, commit, PR | Review / Release | 30m | TASK-0056..0059 | No |

## 依存グラフ

```
TASK-0056 → TASK-0057 → TASK-0058 → TASK-0059 → TASK-0060
```

## リスク

- リスク1: init が user file を壊す → default no overwrite, `--overwrite` opt-in, overwrite tests
- リスク2: dry-run と実行時の差分が生じる → same operation planner を使い、dry-run は write adapter のみ切り替える
- リスク3: profile validation が緩く path traversal になる → profile allowlist と invalid profile test
- リスク4: validation が local-only になる → `make validate` と GitHub Actions の既存 path に CLI test を組み込む

## 必要な検証

- [x] structural: required files, package metadata, docs links
- [x] syntax: `python3 -m json.tool package.json`, `git diff --check`
- [x] unit: profile parser / package script merge through CLI tests
- [x] integration: `node bin/ai-check-template.mjs init` fixture runs
- [x] security: no overwrite, invalid profile reject, secret pattern grep
- [x] architecture: File Scope check, protected file check, `package-templates/**` unchanged

## Quality Gate マッピング

SPEC-0015 を継承。

## Error Resolution

SPEC-0015 を継承。

## Knowledge Management

SPEC-0015 を継承。CLI init failure が再発した場合は maintainer が `sage/failures.md` に command / fixture / expected / actual を記録し、同種 failure 3 回で `sage/anti-patterns.md` 昇格候補にする。

## 段階移行

| 移行 | 昇格条件 | 検証コマンド |
|---|---|---|
| PLAN Active → Implementation | PLAN-0015 と TASK-0056..0060 が各 100/S++ | `sage-evaluate` rubric による PLAN / TASK 個別採点 |
| Implementation → Review | AC-01..AC-12 pass | `make validate` + `node --test tests/cli/*.test.mjs` |
| Review → PR | AC-01..AC-14 pass and final scoring 100/S++ | `make validate` + `bash scripts/sage-validate.sh` + File Scope checks |

## 採用メトリクス

| メトリクス | 合格基準 |
|---|---|
| CLI discoverability | README / README-ja / roadmap から `docs/cli.md` に到達できる |
| init success | fixture project に scripts と selected files が追加される |
| safety | dry-run writes nothing, default overwrite does not replace existing content |
| validation | `make validate` が CLI tests を実行して pass する |

## 関連ID

- SPEC: SPEC-0015
- TASK: TASK-0056, TASK-0057, TASK-0058, TASK-0059, TASK-0060
