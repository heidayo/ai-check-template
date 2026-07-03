#!/usr/bin/env bash
# ai-check-fast.sh — fast AI check entry point (Static + Unit のみ)
#
# 配布される example。AI 内部ループ（Claude Code の Edit hook）から呼ばれる軽量版。
# Static check + Unit test までに限定し、E2E や Diagnostic（React Doctor 等）は含めない。
# timeout 10 分以内で完走する想定。
#
# 詳細思想:
#   - package-templates/docs/philosophy/formal-name-match.md §段階的導入 Phase A/B
#   - Edit hook（fast）と PR Gate（full）のハイブリッド構成の片方
#
# PM 切り替え:
#   ai-check.sh と同じ。PM 環境変数で上書き可。

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

echo "[ai-check-fast] Running: ${PM} ai:check:fast"
"${PM}" ai:check:fast
