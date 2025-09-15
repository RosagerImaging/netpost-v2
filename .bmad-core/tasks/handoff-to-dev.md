# Handoff Story to Development Agent

## Purpose

Automatically transition a completed and validated story from Scrum Master to Development Agent, including GitHub sync and dev agent activation with proper context.

## Prerequisites

- Story file exists and is complete
- Story has passed validation (story-checklist)
- GitHub CLI is authenticated
- Development agent (James) is available

## Task Execution

### 1. Sync Story to GitHub

Execute the sync-github-issue task:
- Create GitHub issue from story
- Apply proper labels (story, ready, size, epic)
- Update story file with GitHub tracking information

### 2. Prepare Dev Agent Context

- Extract story file path for handoff
- Identify story number and title for context
- Prepare activation parameters for dev agent

### 3. Invoke Development Agent

Use the Task tool to invoke the development agent with:
- **Agent Type**: general-purpose (to call specific bmad dev agent)
- **Context**: Story file path and GitHub issue information
- **Instructions**:
  ```
  Activate the bmad-core dev agent (James) for story implementation.

  Story Details:
  - File: {story_file_path}
  - GitHub Issue: #{issue_number}
  - Title: {story_title}

  Instructions for James:
  1. Load the bmad-core dev agent using the activation process
  2. Run *dev-start to mark GitHub issue as in-progress
  3. Run *develop-story to begin implementation
  4. Follow the complete development workflow

  The story contains all necessary context and requirements for implementation.
  ```

### 4. Confirm Handoff

- Verify dev agent activation was successful
- Confirm GitHub issue status updated to "in-progress"
- Report handoff completion to user

## Success Criteria

- GitHub issue created with proper labels
- Story file updated with tracking information
- Development agent successfully activated
- GitHub issue marked as "in-progress"
- User notified of successful handoff

## Error Handling

- **GitHub sync fails**: Report specific error and provide manual steps
- **Agent invocation fails**: Provide manual activation instructions
- **Context missing**: Identify missing information and request clarification

## Expected Output

```
✅ Story Handoff Complete!
📋 GitHub Issue: #{issue_number} - {story_title}
🏷️  Labels: story, ready, size/{size}, epic-{epic}
👨‍💻 Dev Agent (James) activated and working
🔄 Status: In Progress
🔗 Issue Link: {github_url}

James is now implementing the story following the defined tasks and acceptance criteria.
```