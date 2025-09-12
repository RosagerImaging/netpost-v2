#!/bin/bash
# .claude/commands/size.sh
echo "📊 Largest files in project:"
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -exec ls -lh {} + | sort -k5 -rh | head -10
