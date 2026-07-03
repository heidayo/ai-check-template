# .claude/rules/local/ — installer が触らない overlay 置き場

このディレクトリはプロジェクト固有のカスタマイズ用の **overlay 領域**。
`ai-check-template` の installer（init / update / doctor）はこの配下を一切管理しない:

- init はこの README を一度だけ置く（既に存在すれば skip して内容を変更しない）
- update はこの配下のファイルを上書き・削除しない
- doctor はこの配下を drift 検査の対象にしない

> 本ファイルは初回 init 時のスナップショット。最新の説明は配布元の `docs/cli.md` を参照。

## 使い方

### 1. `.claude/rules/local/` — プロジェクト固有ルール

配布 rule（`.claude/rules/test-rules.md` 等）を直接編集すると、update 時に
skip-modified 扱いになり upstream の自動追従から外れる。代わりに、プロジェクト固有の
追加ルールはこのディレクトリに別ファイルとして置く。

```
.claude/rules/
├── test-rules.md        # 配布 rule（installer 管理。直接編集しない）
└── local/
    ├── README.md        # 本ファイル
    └── my-project.md    # プロジェクト固有ルール（自由に追加してよい）
```

### 2. `scripts/ai-check.local.sh` — scripts の overlay

配布 scripts（`scripts/ai-check.sh` 等）は、同ディレクトリに `ai-check.local.sh` が
存在すれば PM 委譲コマンドの前に `source` する。scripts 本体を直接編集する代わりに
こちらへカスタマイズを書く。

```bash
# scripts/ai-check.local.sh の例
# PM を上書き
PM=npm

# 追加の事前チェック
echo "[local] running project-specific pre-check"
```

- 実行権限（+x）は不要（`source` は読み取り権限のみで動作する。chmod 不要）
- 構文エラー・失敗は scripts の非 0 終了として伝播する（silent に無視されない）

## 注意（セキュリティ）

- **任意コード実行**: `ai-check.local.sh` はコミットされた内容がそのまま実行される。
  信頼できない変更を混入させないこと
- **secret 直書き禁止**: `ai-check.local.sh` やこの配下のファイルに secret / token /
  API key を直書きしない。secret は env var / secret manager 経由で渡す

## なぜ overlay を使うのか

installer 管理ファイル（managed ファイル）を直接編集すると、update の 3-way 判定で
skip-modified となり、以後 upstream 更新のたびに keep / overwrite / diff の判断が必要になる。
overlay に書けば managed ファイルは未改変のまま保たれ、update の自動追従が維持される。

- overlay（本ディレクトリ / `ai-check.local.sh`）= 一次手段
- skip-modified = それでも直接編集した場合の安全網
