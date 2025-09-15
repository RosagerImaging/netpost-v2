#!/bin/bash

# .claude/commands/recent.sh

echo "🕐 Recently modified files (last 24h):"
find . -type f -mtime -1 -not -path "_/node_modules/_" -not -path "_/.git/_" | head -15
