#!/bin/sh
set -eu

./scripts/run-bun.sh run check:code
./scripts/run-bun.sh run typecheck
./scripts/run-bun.sh test test/robotFace.test.ts
./scripts/run-bun.sh run build
