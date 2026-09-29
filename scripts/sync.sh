#!/usr/bin/env bash
# Copies each published tab of the Google Sheet into data/<tab>.csv.
# A tab is only overwritten if its first line still matches the header in
# the repo, so a Google error page or a renamed column never replaces data.
set -euo pipefail

BASE="https://docs.google.com/spreadsheets/d/e/2PACX-1vRmcvN0H1kcrlS1qbVx8LrRN5ieOgfLmkoELtAMFD6unjTl6NGq1GpQppX9m4brRRbG7x2FpKre2nV6/pub"
TABS=(
  "open_models:1025751904"
  "decentralized_compute:453968194"
  "token_vs_usage:100999051"
  "korean_sovereign_ai:1286636125"
  "funding_events:1851950062"
)

failed=0
for entry in "${TABS[@]}"; do
  name="${entry%%:*}"
  gid="${entry##*:}"
  tmp="$(mktemp)"
  if ! curl -sfL --retry 3 "$BASE?gid=$gid&single=true&output=csv" | tr -d '\r' > "$tmp"; then
    echo "::error::$name: download failed"; failed=1; continue
  fi
  expected="$(head -n 1 "data/$name.csv" | tr -d '\r')"
  got="$(head -n 1 "$tmp")"
  if [ "$got" != "$expected" ]; then
    echo "::error::$name: header changed or not a CSV. Expected '$expected', got '${got:0:120}'"
    failed=1; continue
  fi
  # Google leaves the last line without a newline; add one so diffs stay clean.
  [ -n "$(tail -c 1 "$tmp")" ] && echo >> "$tmp"
  mv "$tmp" "data/$name.csv"
  echo "$name: $(($(wc -l < "data/$name.csv") - 1)) rows"
done
exit $failed
