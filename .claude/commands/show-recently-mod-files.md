#!/bin/bash
# .claude/commands/recent.sh
echo "🕐 Recently modified files (last 24h):"
find . -type f -mtime -1 -not -path "*/node_modules/*" -not -path "*/.git/*" | head -15
