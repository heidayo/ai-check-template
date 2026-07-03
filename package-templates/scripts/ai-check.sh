#!/usr/bin/env bash
# ai-check.sh — full AI check pipeline entry point
#
# 配布される example。利用者がコピーして自プロジェクトの scripts/ または bin/ に配置し、
# `bash scripts/ai-check.sh` で呼ぶ薄いラッパー。
#
# 形名参同（package-templates/docs/philosophy/formal-name-match.md）:
#   事前宣言した「名」（成功基準）と実測「形」（コマンド出力）を一括照合する。
#   本スクリプトは「形」の取得を担当し、npm scripts の ai:check に委譲する。
#
# PM 切り替え:
#   デフォルト pnpm。npm/yarn/bun を使う場合は PM 環境変数で上書き:
#     PM=npm  bash ai-check.sh
#     PM=yarn bash ai-check.sh
#     PM=bun  bash ai-check.sh

set -euo pipefail

PM="${PM:-pnpm}"

# local overlay:
#   この if ブロックは installer（ai-check-template init / update）が管理する scripts 本体の一部。
#   カスタマイズは source 行を編集せず、同ディレクトリの ai-check.local.sh 側に書く。
#   注意: ai-check.local.sh はコミットされた内容がそのまま実行される（任意コード実行）。
#   信頼できない変更を混入させないこと。secret / token / API key を直書きせず、
#   env var / secret manager 経由で渡すこと。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/ai-check.local.sh" ]; then
  # shellcheck source=/dev/null
  source "${SCRIPT_DIR}/ai-check.local.sh"
fi

echo "[ai-check] Running: ${PM} ai:check"
"${PM}" ai:check
