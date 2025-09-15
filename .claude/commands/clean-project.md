#!/bin/bash

# .claude/commands/clean.sh

echo "🧹 Cleaning project..."
rm -rf node_modules package-lock.json
find . -name "\*.backup" -type f -delete
find . -name ".DS_Store" -type f -delete
npm cache clean --force
echo "✅ Cleaned! Run 'npm install' to reinstall dependencies"
