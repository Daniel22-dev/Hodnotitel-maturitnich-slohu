#!/usr/bin/env bash
# Overlap installation of Playwright-pinned Chromium with Ubuntu OS packages.
# Both phases must PASS; no cache, no browser variant omitted, no downgrade.
set -euo pipefail

scratch="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/ghrab-playwright-bootstrap.XXXXXXXX")"
deps_pid=''
browser_pid=''
cleanup() {
  if [[ -n "$deps_pid" ]]; then kill "$deps_pid" 2>/dev/null || true; fi
  if [[ -n "$browser_pid" ]]; then kill "$browser_pid" 2>/dev/null || true; fi
  rm -rf -- "$scratch"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

start_ms="$(date +%s%3N)"
# The two independent commands perform the same work as
# 'npx playwright install --with-deps chromium', but concurrently.
# --no-install prevents any implicit replacement of the locked npm CLI.
npx --no-install playwright install-deps chromium > "$scratch/deps.log" 2>&1 &
deps_pid="$!"
npx --no-install playwright install chromium > "$scratch/browser.log" 2>&1 &
browser_pid="$!"

deps_code=0
browser_code=0
if wait "$deps_pid"; then :; else deps_code="$?"; fi
deps_pid=''
if wait "$browser_pid"; then :; else browser_code="$?"; fi
browser_pid=''

end_ms="$(date +%s%3N)"
sed 's/^/[playwright OS deps] /' "$scratch/deps.log"
sed 's/^/[playwright Chromium] /' "$scratch/browser.log"
printf 'PLAYWRIGHT_BOOTSTRAP_METRICS duration_ms=%s deps_exit=%s browser_exit=%s\n' "$((end_ms - start_ms))" "$deps_code" "$browser_code"
if (( deps_code != 0 || browser_code != 0 )); then
  echo 'PLAYWRIGHT_BOOTSTRAP_FAILED: pinned browser and OS dependencies are both mandatory' >&2
  exit 1
fi
printf 'PLAYWRIGHT_BOOTSTRAP_PASS\n'
