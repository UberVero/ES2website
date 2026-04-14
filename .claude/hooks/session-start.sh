#!/bin/bash
# SessionStart hook for Claude Code on the web.
#
# Prepares the session to run the Playwright mobile layout suite:
#   - installs JS deps (notion-sync + @playwright/test)
#   - installs the Chromium browser Playwright drives
#
# Runs only in remote (web) sessions; no-op locally so your laptop
# doesn't get hit every time you start a session.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

echo "[session-start] Installing npm dependencies..."
npm install --no-audit --no-fund

echo "[session-start] Installing Playwright browsers (Chromium + WebKit)..."
# WebKit powers the iPhone device profiles; Chromium powers Pixel 5.
npx --yes playwright install --with-deps chromium webkit

echo "[session-start] Done. Run tests with: npm run test:mobile"
