#!/usr/bin/env bash
# ai-check-secure.sh — security check pipeline entry point
#
# Distributed example. Copy this to scripts/ or bin/ in the target project and
# call it with `bash scripts/ai-check-secure.sh`.
#
# Security split:
#   `ai:check` remains the functional quality gate.
#   `ai:check:secure` is the security-oriented gate and delegates to Semgrep by
#   default through package.json scripts.
#
# PM switching:
#   Default is pnpm. Override with PM for npm/yarn/bun:
#     PM=npm  bash ai-check-secure.sh
#     PM=yarn bash ai-check-secure.sh
#     PM=bun  bash ai-check-secure.sh

set -euo pipefail

PM="${PM:-pnpm}"

echo "[ai-check-secure] Running: ${PM} ai:check:secure"
"${PM}" ai:check:secure
