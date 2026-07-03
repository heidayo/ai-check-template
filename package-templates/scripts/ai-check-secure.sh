#!/usr/bin/env bash
# ai-check-secure.sh — security check pipeline entry point
#
# Distributed example. Copy this to scripts/ or bin/ in the target project and
# call it with `bash scripts/ai-check-secure.sh`.
#
# Security split:
#   `ai:check` remains the functional quality gate.
#   `ai:check:secure` is the security-oriented gate and delegates to the target
#   project's package scripts. The default chain covers secret scan, dependency
#   audit, supply-chain check, and Semgrep SAST.
#
# PM switching:
#   Default is pnpm. Override with PM for npm/yarn/bun:
#     PM=npm  bash ai-check-secure.sh
#     PM=yarn bash ai-check-secure.sh
#     PM=bun  bash ai-check-secure.sh

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

echo "[ai-check-secure] Running: ${PM} ai:check:secure"
"${PM}" ai:check:secure
