#!/bin/bash
# .claude/commands/todo.sh
echo "📝 TODO List:"
grep -r "TODO\|FIXME\|HACK" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.git . | head -20
