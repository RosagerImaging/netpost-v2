#!/bin/bash

# .claude/commands/branch.sh

if [ -z "$1" ]; then
echo "📋 Current branches:"
git branch -a
else
echo "🌿 Creating and switching to: $1"
git checkout -b "$1"
fi
