# Sync Story to GitHub Issue Task

## Purpose

To automatically create a GitHub issue from a completed story document, mapping story content to the appropriate GitHub issue template fields and applying correct labels for project tracking.

## Task Execution

### 1. Validate Prerequisites

- Verify GitHub CLI is installed and authenticated: `gh auth status`
- Confirm the repository has issue templates configured
- Check that the story file exists and is complete

### 2. Parse Story Content

- Read the specified story file (e.g., `docs/stories/1.1.project-initialization.md`)
- Extract key information:
  - **Story Title**: From the h1 heading (remove "Story X.X:" prefix for clean title)
  - **User Story Statement**: From the "Story" section
  - **Acceptance Criteria**: From the "Acceptance Criteria" section (convert to checklist format)
  - **Technical Details**: From "Tasks / Subtasks" and "Dev Notes" sections
  - **Epic Information**: Derive from story number (1.x = Epic 1, 2.x = Epic 2, etc.)

### 3. Determine Story Metadata

- **Story Size**: Estimate based on number of tasks and complexity:
  - 1-3 tasks = S (Small)
  - 4-6 tasks = M (Medium)
  - 7+ tasks = L (Large)
- **Epic Area**: Map story number to epic:
  - 1.x = "Beta Platform Core Workflow"
  - 2.x = "AI Assistant Suite"
  - 3.x = "Monetization & Public Launch"
- **Labels**: Always apply `story` and `ready` labels

### 4. Create GitHub Issue

Use the GitHub CLI to create an issue with the user-story template:

```bash
gh issue create \
  --template user-story.yml \
  --title "[Story X.X] {Clean Story Title}" \
  --body "$(cat <<'EOF'
{User Type}

{User Story Statement}

{Acceptance Criteria as checklist}

{Epic Area}

{Story Size}

{Technical Implementation Notes from Tasks/Dev Notes}

Dependencies: {Any noted dependencies}
EOF
)"
```

### 5. Apply Labels

```bash
gh issue edit {ISSUE_NUMBER} \
  --add-label "story" \
  --add-label "ready" \
  --add-label "size/{size}" \
  --add-label "{epic-area-label}"
```

### 6. Update Story File

- Add GitHub issue reference to the story file
- Update the Change Log with GitHub issue creation
- Add issue number to a new "GitHub Tracking" section

### 7. Provide Summary

Report to user:
- GitHub issue number created
- Labels applied
- Direct link to the issue
- Confirmation that story file was updated with tracking info

## Error Handling

- **GitHub CLI not authenticated**: Provide authentication instructions
- **Issue template not found**: List available templates and suggest fix
- **Story file malformed**: Identify specific parsing issues
- **API rate limits**: Suggest retry timing
- **Network issues**: Provide manual fallback steps

## Example Output

```
✅ GitHub Issue Created Successfully!
📋 Issue #42: Project Initialization - Turborepo Foundation
🏷️  Labels Applied: story, ready, size/l, epic-1-beta-platform
🔗 Link: https://github.com/username/netpost-v2/issues/42
📝 Story file updated with tracking information
```

## Manual Fallback

If automation fails, provide the user with:
1. Pre-filled issue template content they can copy/paste
2. Specific labels to apply manually
3. Instructions for linking back to the story file