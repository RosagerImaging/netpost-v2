# Orchestrate Complete Story Workflow

## Purpose

Execute the complete automated BMad workflow: SM → Dev → QA → Dev (if fixes) → SM completion. This task orchestrates the full story lifecycle with GitHub automation at each step.

## Prerequisites

- Story file exists and is complete
- GitHub CLI is authenticated (`gh auth status`)
- All BMad agents are available for invocation
- Repository has proper GitHub issue templates and labels configured

## Workflow Overview

```
SM Draft → GitHub Issue Creation → Dev Implementation → QA Review → [Fixes if needed] → Story Done
```

## Task Execution

### Phase 1: Scrum Master (Story Validation & GitHub Setup)

**Trigger**: Manual invocation by BMad Master with `*orchestrate-story [story-file]`

1. **Load Scrum Master Agent Context**
   - Validate story completeness using story-draft-checklist
   - Ensure all acceptance criteria are clear and testable
   - Verify technical requirements are detailed

2. **GitHub Issue Creation & Sync**
   - Execute `sync-github-issue` task
   - Create GitHub issue with proper labels (story, ready, size, epic)
   - Update story file with GitHub tracking information

3. **Handoff to Development**
   - Execute `handoff-to-dev` task
   - Invoke development agent using Task tool with proper context
   - Update GitHub issue status to "in-progress"

### Phase 2: Development Agent (Implementation)

**Trigger**: Automatic handoff from SM phase

1. **Development Start**
   - Execute `sync-github-dev` with `*dev-start` command
   - Update GitHub issue labels: remove "ready", add "in-progress"
   - Initialize Dev Agent Record in story file

2. **Implementation Process**
   - Follow complete development workflow from dev agent
   - Periodic progress updates via `sync-github-dev` with `*dev-update`
   - Handle all tasks and acceptance criteria implementation

3. **Development Completion**
   - Execute `sync-github-dev` with `*dev-complete` command
   - Update GitHub issue labels: remove "in-progress", add "review"
   - Complete Dev Agent Record with file list and completion notes
   - **Automatic Handoff to QA**: Invoke QA agent with story context

### Phase 3: QA Agent (Quality Review)

**Trigger**: Automatic handoff from Dev completion

1. **QA Review Start**
   - Execute `sync-github-qa` with `*qa-start` command
   - Add QA start comment to GitHub issue
   - Initialize QA Results section in story file

2. **Quality Assessment Process**
   - Execute comprehensive QA review using `review-story` task
   - Create quality gate decision
   - Periodic updates via `sync-github-qa` with `*qa-update`

3. **QA Decision Branch**

   **Path A: QA PASS**
   - Execute `sync-github-qa` with `*qa-pass` command
   - Update GitHub issue labels: remove "review", add "done"
   - Close GitHub issue with approval
   - **Jump to Phase 5: Story Completion**

   **Path B: QA FAIL/CONCERNS**
   - Execute `sync-github-qa` with `*qa-fail` command
   - Keep GitHub issue in "review", add "qa-failed" label
   - **Automatic Handoff back to Dev**: Invoke dev agent with QA feedback

### Phase 4: Development Agent (QA Fixes) - If Needed

**Trigger**: Automatic handoff from QA fail/concerns

1. **Load QA Feedback**
   - Parse QA Results section for specific issues
   - Load quality gate file for detailed fix requirements
   - Update GitHub issue with fix start comment

2. **Apply Fixes**
   - Execute `apply-qa-fixes` task
   - Address all QA concerns and recommendations
   - Update GitHub issue with fix progress

3. **Fixes Completion**
   - Update Dev Agent Record with fix details
   - Mark fixes complete in GitHub issue
   - **Automatic Re-handoff to QA**: Invoke QA agent for re-review

### Phase 5: Story Completion (SM Final Review)

**Trigger**: Automatic trigger when QA passes

1. **Final Validation**
   - Verify all acceptance criteria are met
   - Confirm GitHub issue is properly closed
   - Validate story file is complete with all sections

2. **Story Finalization**
   - Update story status from "Draft" to "Done"
   - Add final Change Log entry
   - Generate completion summary report

3. **Workflow Completion Report**
   - GitHub issue link and final status
   - Summary of implementation and QA results
   - File list of all changes
   - Quality score and gate status

## GitHub Label Automation Mapping

| Story Phase | Add Labels | Remove Labels | Issue Status |
|-------------|------------|---------------|--------------|
| SM Complete | `story`, `ready`, `size/*`, `epic-*` | - | Open |
| Dev Start | `in-progress` | `ready` | Open |
| Dev Complete | `review` | `in-progress` | Open |
| QA Start | - | - | Open |
| QA Pass | `done` | `review` | Closed |
| QA Fail | `qa-failed` | - | Open |
| Fix Start | `fixing` | `qa-failed` | Open |
| Fix Complete | `review` | `fixing` | Open |

## Agent Invocation Commands

### For Task Tool Integration

```yaml
# Scrum Master Invocation
subagent_type: "general-purpose"
description: "Invoke BMad SM agent"
prompt: |
  Activate BMad Scrum Master agent (Bob) to validate story and create GitHub issue.

  Story: {story_file_path}
  Command: Validate story using *validate-next-story, then *sync-github-issue

  After completion, immediately handoff to development using *handoff-to-dev

# Development Agent Invocation
subagent_type: "general-purpose"
description: "Invoke BMad Dev agent"
prompt: |
  Activate BMad Development agent (James) to implement story requirements.

  Story: {story_file_path}
  GitHub Issue: #{issue_number}
  Command: Start with *dev-start, implement with *develop-story, complete with *dev-complete

  After completion, automatically handoff to QA agent for review.

# QA Agent Invocation
subagent_type: "general-purpose"
description: "Invoke BMad QA agent"
prompt: |
  Activate BMad QA agent (Quinn) to review implemented story.

  Story: {story_file_path}
  GitHub Issue: #{issue_number}
  Command: Start with *qa-start, review with *review, decide with *gate

  If QA fails, handoff back to development for fixes.
  If QA passes, complete the workflow.
```

## Error Handling & Recovery

### Common Failure Points
- **GitHub API failures**: Retry with exponential backoff
- **Agent invocation failures**: Provide manual activation steps
- **Story file parsing errors**: Identify specific formatting issues
- **Authentication failures**: Re-authenticate GitHub CLI

### Recovery Procedures
1. **Manual Mode**: Switch to individual agent commands if automation fails
2. **Partial Recovery**: Resume workflow from last successful phase
3. **Rollback**: Revert GitHub issue changes if needed

## Command Interface

### Primary Command
```bash
*orchestrate-story [story-file-path]
```

### Control Commands
```bash
*orchestrate-pause        # Pause at current phase
*orchestrate-resume       # Resume from pause
*orchestrate-status       # Show current workflow status
*orchestrate-manual       # Switch to manual mode
```

## Success Indicators

- ✅ GitHub issue created with proper labels
- ✅ Development completed with full implementation
- ✅ QA review completed with gate decision
- ✅ All fixes applied if QA required changes
- ✅ Story status updated to "Done"
- ✅ GitHub issue closed with final approval
- ✅ Complete audit trail in story file and GitHub

## Output Templates

### Workflow Start
```
🚀 **BMad Orchestrated Workflow Started**
📋 Story: {story_title}
🔗 File: {story_file_path}
⏱️ Start Time: {timestamp}

Phase 1: SM Validation & GitHub Setup...
```

### Phase Transitions
```
✅ Phase {n} Complete: {phase_name}
🔄 Transitioning to Phase {n+1}: {next_phase}
👤 Invoking: {next_agent_name}
```

### Workflow Complete
```
🎉 **BMad Orchestrated Workflow Complete!**
📋 Story: {story_title} ✅ DONE
🔗 GitHub Issue: #{issue_number} (Closed)
📊 Quality Score: {quality_score}/100
⏱️ Total Time: {duration}

**Implementation Summary:**
{dev_completion_summary}

**QA Results:**
{qa_gate_decision} - {qa_summary}

**Files Changed:**
{file_list}
```

## Integration Notes

- This task is designed to be called by BMad Master
- Each phase uses existing BMad tasks and agents
- GitHub automation is integrated at every transition
- Maintains full audit trail in both story files and GitHub
- Compatible with existing BMad agent architecture