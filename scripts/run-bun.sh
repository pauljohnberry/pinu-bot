#!/bin/sh
set -eu

if command -v bun >/dev/null 2>&1; then
  exec bun "$@"
fi

if [ -x "${BUN_INSTALL:-$HOME/.bun}/bin/bun" ]; then
  exec "${BUN_INSTALL:-$HOME/.bun}/bin/bun" "$@"
fi

echo "bun not found. Install Bun from https://bun.sh or set BUN_INSTALL." >&2
exit 127
