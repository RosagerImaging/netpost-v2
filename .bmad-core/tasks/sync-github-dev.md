# Sync GitHub Issue - Dev Agent Workflow

## Purpose

To automatically update GitHub issues during development phases, tracking progress from story pickup through completion, and updating the story file's Dev Agent Record section with implementation details.

## Task Execution

### 1. Validate Prerequisites

- Verify GitHub CLI is installed and authenticated: `gh auth status`
- Confirm story file exists and contains GitHub tracking information
- Check that GitHub issue exists and is accessible
- Validate user has permission to update the repository

### 2. Parse Story and GitHub Context

- Read the story file (provided as parameter or from current working context)
- Extract GitHub issue number from "GitHub Tracking" section
- Parse story title, acceptance criteria, and task list
- Identify current story status and implementation phase

### 3. Development Phase Operations

#### **When Starting Development** (`*dev-start`)
- Update GitHub issue labels: Remove `ready`, add `in-progress`
- Add comment to GitHub issue: "🚀 Development started by James (Dev Agent)"
- Update story file Dev Agent Record with start timestamp and agent model
- Create entry in Debug Log References section

#### **When Updating Progress** (`*dev-update`)
- Add progress comment to GitHub issue with completed tasks/challenges
- Update story file Completion Notes with current status
- Reference any relevant commits, branches, or technical decisions
- Update Debug Log References with any debugging information

#### **When Development Complete** (`*dev-complete`)
- Update GitHub issue labels: Remove `in-progress`, add `review`
- Add completion comment with summary of implementation
- Update story file with complete Dev Agent Record:
  - Agent Model Used
  - Debug Log References (if any)
  - Completion Notes List (detailed)
  - File List (all files created/modified)
- Update story Change Log with development completion entry

### 4. GitHub Issue Management

#### **Start Development Comment Template**
```
🚀 **Development Started**

**Dev Agent**: James
**Model**: {agent_model_version}
**Start Time**: {timestamp}

**Implementation Plan:**
{key_tasks_from_story}

**Technical Approach:**
{summary_from_dev_notes}
```

#### **Progress Update Template**
```
⚙️ **Development Progress Update**

**Completed:**
- [x] {completed_task_1}
- [x] {completed_task_2}

**In Progress:**
- [ ] {current_task}

**Technical Notes:**
{any_challenges_or_decisions}

**Files Modified:**
{list_of_key_files}
```

#### **Development Complete Template**
```
✅ **Development Complete - Ready for QA**

**Implementation Summary:**
{summary_of_what_was_built}

**Acceptance Criteria Status:**
{checklist_of_AC_completion}

**Key Files Created/Modified:**
{comprehensive_file_list}

**Testing Status:**
{unit_tests_integration_tests_status}

**Known Issues/Notes:**
{any_issues_for_qa_attention}

**Branch/PR**: {if_applicable}
```

### 5. Story File Updates

#### **Dev Agent Record Section Updates**
```markdown
## Dev Agent Record

### Agent Model Used
{model_name_and_version}

### Debug Log References
{any_debug_logs_or_traces_generated}

### Completion Notes List
- Started development: {timestamp}
- {detailed_implementation_notes}
- {any_technical_decisions_made}
- {challenges_encountered_and_solutions}
- Completed development: {timestamp}

### File List
**Created:**
- {new_files_created}

**Modified:**
- {existing_files_modified}

**Key Changes:**
- {summary_of_major_changes}
```

#### **Change Log Entry**
```markdown
| Date | Version | Description | Author |
|------|---------|-------------|---------|
| {date} | {version} | Development completed - implemented {brief_summary} | James (Dev Agent) |
```

### 6. Error Handling

- **Missing GitHub issue**: Provide clear error with story file path
- **GitHub API errors**: Retry logic and fallback to manual instructions
- **Story file not found**: Request story file path from user
- **Permission errors**: Clear instructions for authentication/access
- **Malformed story file**: Identify specific parsing issues

### 7. Command Variations

#### **`*dev-start [story-file]`**
- Parse story file and GitHub issue
- Update issue to in-progress
- Initialize Dev Agent Record section

#### **`*dev-update [progress-notes]`**
- Add progress comment to GitHub issue
- Update Completion Notes in story file

#### **`*dev-complete [summary]`**
- Move issue to review status
- Complete all Dev Agent Record sections
- Add comprehensive completion comment

### 8. Integration with Development Workflow

- **Branch Creation**: Suggest branch naming from GitHub issue number
- **Commit Linking**: Provide commit message templates that reference issue
- **PR Creation**: Template for PR that will auto-close issue when merged
- **Test Integration**: Remind about test requirements from story

## Example Workflow Usage

```bash
# Dev agent starts working on Story 1.1
*dev-start docs/stories/1.1.project-initialization.md

# Updates progress mid-development
*dev-update "Completed Turborepo setup, working on Next.js configuration"

# Completes development
*dev-complete "All acceptance criteria met, ready for QA review"
```

## Manual Fallback

If automation fails, provide the user with:
1. Exact GitHub CLI commands to run manually
2. Story file sections that need manual updates
3. Template comments for GitHub issue updates
4. Checklist of all required actions