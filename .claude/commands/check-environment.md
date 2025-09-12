#!/bin/bash
# .claude/commands/env.sh
echo "🔧 Environment Check:"
echo "Node: $(node -v)"
echo "NPM: $(npm -v)"
echo "---"
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "Variables defined: $(grep -c "=" .env)"
else
    echo "❌ No .env file"
fi
if [ -f .env.example ]; then
    echo "📋 Required vars from .env.example:"
    grep -o "^[^#=]*" .env.example
fi
