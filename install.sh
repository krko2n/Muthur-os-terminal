#!/usr/bin/env bash
# Wrapper -- actual installer lives in scripts/
exec "$(dirname "$0")/scripts/install.sh" "$@"
