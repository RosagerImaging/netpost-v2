#!/bin/bash
# GitHub Labels Setup for NetPost V2
# Run this script to create all necessary labels for agile workflow

echo "🏷️ Setting up GitHub labels for NetPost V2..."

# Story Management
gh label create "story" --description "User story" --color "0075ca" || echo "Label 'story' already exists"
gh label create "task" --description "Technical task" --color "7057ff" || echo "Label 'task' already exists"
gh label create "bug" --description "Bug report" --color "d73a4a" || echo "Label 'bug' already exists"
gh label create "epic" --description "Large feature" --color "a2eeef" || echo "Label 'epic' already exists"

# Status Labels
gh label create "ready" --description "Ready for development" --color "0e8a16" || echo "Label 'ready' already exists"
gh label create "in-progress" --description "Currently being worked on" --color "fbca04" || echo "Label 'in-progress' already exists"
gh label create "review" --description "Ready for review" --color "ff9500" || echo "Label 'review' already exists"
gh label create "blocked" --description "Blocked by dependency" --color "b60205" || echo "Label 'blocked' already exists"

# Size Labels
gh label create "size/xs" --description "1-2 hours" --color "c5def5" || echo "Label 'size/xs' already exists"
gh label create "size/s" --description "Half day" --color "bfd4f2" || echo "Label 'size/s' already exists"
gh label create "size/m" --description "1-2 days" --color "9ecbff" || echo "Label 'size/m' already exists"
gh label create "size/l" --description "3-4 days" --color "74b9ff" || echo "Label 'size/l' already exists"
gh label create "size/xl" --description "1 week+" --color "0366d6" || echo "Label 'size/xl' already exists"

# Feature Areas
gh label create "inventory" --description "Inventory management" --color "d4edda" || echo "Label 'inventory' already exists"
gh label create "listing" --description "Cross-platform listing" --color "cce5ff" || echo "Label 'listing' already exists"
gh label create "ai-assistant" --description "AI features" --color "f3e2f3" || echo "Label 'ai-assistant' already exists"
gh label create "auth" --description "Authentication" --color "fff3cd" || echo "Label 'auth' already exists"
gh label create "dashboard" --description "Dashboard & analytics" --color "e2f0d9" || echo "Label 'dashboard' already exists"
gh label create "ui-components" --description "UI component library" --color "e1ecf4" || echo "Label 'ui-components' already exists"

echo "✅ GitHub labels setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Run: chmod +x .github/setup-labels.sh"
echo "2. Run: ./.github/setup-labels.sh"
echo "3. Start creating issues with your new templates!"
echo ""
echo "💡 Templates available at:"
echo "   - User Story: Uses 📋 template"
echo "   - Technical Task: Uses ⚙️ template"
echo "   - Bug Report: Uses 🐛 template"