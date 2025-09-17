# BMad Workflow State Management

## Purpose

Track orchestrated workflow state for resumption, monitoring, and error recovery.

## State File Location

`.bmad-core/workflow-state.yaml` (gitignored, local only)

## State Schema

```yaml
version: 1
current_workflow:
  story_file: "docs/stories/1.2.user-accounts.md"
  github_issue: 42
  phase: "development" # sm-validation | development | qa-review | dev-fixes | completion
  status: "in-progress" # pending | in-progress | paused | completed | failed
  started_at: "2025-09-17T10:30:00Z"
  last_updated: "2025-09-17T11:45:00Z"

phases_completed:
  - phase: "sm-validation"
    completed_at: "2025-09-17T10:45:00Z"
    agent: "Bob (Scrum Master)"
    outputs:
      - github_issue_created: 42
      - story_validated: true

current_phase:
  name: "development"
  agent: "James (Development Agent)"
  started_at: "2025-09-17T10:45:00Z"
  progress:
    tasks_completed: ["Task 1", "Task 2"]
    tasks_in_progress: ["Task 3"]
    tasks_pending: ["Task 4", "Task 5"]

error_log: []

next_phase:
  name: "qa-review"
  agent: "Quinn (QA Agent)"
  trigger: "development_complete"
```

## State Operations

### Initialize Workflow
```yaml
# Create new workflow state when orchestration starts
*orchestrate-story [story-file] → creates workflow-state.yaml
```

### Update Phase Progress
```yaml
# Update current phase progress and transition to next
phase_transition:
  from: "development"
  to: "qa-review"
  timestamp: "2025-09-17T12:00:00Z"
  trigger_data:
    dev_complete: true
    files_changed: ["app.ts", "auth.ts"]
```

### Recovery Information
```yaml
recovery:
  last_successful_phase: "development"
  manual_resume_commands:
    - "*qa-start docs/stories/1.2.user-accounts.md"
  github_sync_status:
    issue_42: "in-progress" # last known GitHub state
```

## Usage by BMad Master

### Start Orchestration
1. Create workflow state file
2. Initialize with story file and phase: "sm-validation"
3. Begin execution

### Phase Transitions
1. Update completed phases
2. Set next phase as current
3. Log transition data
4. Continue execution

### Pause/Resume
1. **Pause**: Set status to "paused", save current context
2. **Resume**: Load state, determine next action, continue
3. **Status**: Read state file, display current phase and progress

### Error Recovery
1. Log errors to error_log array
2. Determine last successful phase
3. Provide recovery instructions
4. Allow manual resumption

## Integration with GitHub Automation

Each phase update includes GitHub synchronization:

```yaml
github_sync:
  issue_number: 42
  last_label_update: "2025-09-17T11:45:00Z"
  current_labels: ["story", "in-progress", "size/m", "epic-1"]
  pending_updates: []
```

## Cleanup

- Remove workflow-state.yaml when orchestration completes successfully
- Archive state to story file metadata for audit trail
- Clean up any temporary files created during workflow