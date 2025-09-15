#!/bin/bash

# .claude/commands/undo.sh

echo "⏪ Undoing last commit (keeping changes)..."
git reset --soft HEAD~1
git status
