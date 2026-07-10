#!/bin/bash
cd "$(dirname "$0")/../agent" || exit 1
bun run dev
