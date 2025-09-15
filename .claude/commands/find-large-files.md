#!/bin/bash

# .claude/commands/size.sh

echo "📊 Largest files in project:"
find . -type f -not -path "_/node_modules/_" -not -path "_/.git/_" -exec ls -lh {} + | sort -k5 -rh | head -10
