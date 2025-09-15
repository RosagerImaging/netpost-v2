#!/bin/bash

# .claude/commands/todo.sh

echo "📝 TODO List:"
grep -r "TODO\|FIXME\|HACK" --include="_.js" --include="_.ts" --include="_.tsx" --include="_.jsx" --exclude-dir=node_modules --exclude-dir=.git . | head -20
