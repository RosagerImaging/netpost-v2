# Sync GitHub Issue - QA Agent Workflow

## Purpose

To automatically update GitHub issues during QA phases, tracking quality assessment from review start through completion, and updating the story file's QA Results section with comprehensive quality findings.

## Task Execution

### 1. Validate Prerequisites

- Verify GitHub CLI is installed and authenticated: `gh auth status`
- Confirm story file exists with completed Dev Agent Record section
- Check that GitHub issue exists and is in "review" status
- Validate QA has necessary access to test environment/code

### 2. Parse Story and Implementation Context

- Read the story file and extract GitHub issue number
- Review acceptance criteria and implementation tasks
- Parse Dev Agent Record for implementation details
- Identify files created/modified for testing scope

### 3. QA Phase Operations

#### **When Starting QA Review** (`*qa-start`)

- Add comment to GitHub issue: "🧪 QA Review started by Quinn (QA Agent)"
- Initialize QA Results section in story file
- Create QA test plan based on acceptance criteria
- Note any testing environment setup requirements

#### **When Updating QA Progress** (`*qa-update`)

- Add QA progress comment to GitHub issue
- Update QA Results section with current findings
- Document any bugs found or issues identified
- Track testing coverage and progress

#### **When QA Passes** (`*qa-pass`)

- Update GitHub issue labels: Remove `review`, add `done`
- Close GitHub issue with QA approval comment
- Complete QA Results section with PASS status
- Update story status from Draft to Done

#### **When QA Fails** (`*qa-fail`)

- Keep GitHub issue in `review` status, add `qa-failed` label
- Add detailed failure comment with specific issues
- Update QA Results with FAIL status and required fixes
- Reference any bug reports or additional issues created

### 4. GitHub Issue Management

#### **QA Start Comment Template**

```
🧪 **QA Review Started**

**QA Agent**: Quinn
**Review Type**: {comprehensive/focused/risk-based}
**Start Time**: {timestamp}

**Testing Scope:**
{based_on_acceptance_criteria}

**Implementation Review:**
{summary_from_dev_agent_record}

**Test Environment**: {environment_details}
```

#### **QA Progress Update Template**

```
🔍 **QA Progress Update**

**Tested:**
- [x] {completed_test_area_1}
- [x] {completed_test_area_2}

**In Progress:**
- [ ] {current_test_area}

**Findings:**
{any_issues_or_observations}

**Coverage**: {percentage_or_scope_completed}
```

#### **QA Pass Template**

```
✅ **QA APPROVED - Story Complete**

**Quality Assessment**: PASS

**Acceptance Criteria Verification:**
{detailed_AC_verification_checklist}

**Test Coverage Completed:**
{comprehensive_test_coverage_summary}

**Quality Attributes Verified:**
- Security: {status}
- Performance: {status}
- Accessibility: {status}
- Usability: {status}

**Recommendations for Future:**
{any_improvement_suggestions}

**Story Status**: Moving to DONE ✅
```

#### **QA Fail Template**

```
❌ **QA CONCERNS - Fixes Required**

**Quality Assessment**: FAIL

**Critical Issues Found:**
{list_of_blocking_issues}

**Acceptance Criteria Gaps:**
{specific_AC_not_met}

**Required Fixes:**
1. {specific_fix_1}
2. {specific_fix_2}

**Additional Issues Created:**
{links_to_bug_reports_if_any}

**Recommendation**: Return to development for fixes
```

### 5. Story File Updates

#### **QA Results Section**

```markdown
## QA Results

**QA Agent**: Quinn (Test Architect)
**Review Date**: {date}
**Assessment Type**: {comprehensive/focused/risk-based}

### Test Coverage Summary

- **Acceptance Criteria**: {x/y} verified
- **Functional Testing**: {status}
- **Integration Testing**: {status}
- **User Experience**: {status}
- **Performance**: {status}
- **Security**: {status}

### Quality Gate Decision

**RESULT**: {PASS/FAIL/CONCERNS/WAIVED}

### Findings & Recommendations

{detailed_qa_findings}

### Test Evidence

{links_to_test_results_screenshots_etc}

### Future Improvements

{suggestions_for_next_iteration}
```

#### **Story Status Update**

```markdown
## Status

{Draft → Done (if QA passes)}
{Draft → Review (if QA fails)}
```

#### **Change Log Entry**

```markdown
| Date   | Version   | Description                                    | Author           |
| ------ | --------- | ---------------------------------------------- | ---------------- |
| {date} | {version} | QA {PASS/FAIL} - {brief_summary_of_assessment} | Quinn (QA Agent) |
```

### 6. Quality Assessment Framework

#### **Risk-Based Testing Approach**

- **High Risk**: Critical user flows, security, data integrity
- **Medium Risk**: Standard functionality, integrations
- **Low Risk**: UI polish, minor features

#### **Test Categories**

- **Functional**: All acceptance criteria met
- **Non-Functional**: Performance, security, accessibility
- **Integration**: Component interactions work correctly
- **User Experience**: Design system compliance, usability

#### **Quality Gates**

- **PASS**: All acceptance criteria met, no critical issues
- **CONCERNS**: Minor issues found, recommendations provided
- **FAIL**: Critical issues or unmet acceptance criteria
- **WAIVED**: Issues acknowledged but accepted for business reasons

### 7. Command Variations

#### **`*qa-start [story-file]`**

- Parse story file and start QA review
- Initialize QA Results section
- Add start comment to GitHub issue

#### **`*qa-update [findings]`**

- Add progress comment to GitHub issue
- Update QA Results with current findings

#### **`*qa-pass [summary]`**

- Close GitHub issue as complete
- Mark story as Done with QA approval

#### **`*qa-fail [issues]`**

- Keep issue open with failure details
- Document required fixes in QA Results

### 8. Integration with Development Workflow

- **Bug Reporting**: Create linked issues for bugs found
- **Regression Testing**: Check previous story functionality
- **Documentation Review**: Verify implementation matches requirements
- **Performance Validation**: Basic performance checks for critical paths

## Example Workflow Usage

```bash
# QA agent starts reviewing completed Story 1.1
*qa-start docs/stories/1.1.project-initialization.md

# Updates progress during testing
*qa-update "Verified Turborepo setup, testing Next.js configuration"

# Passes QA with approval
*qa-pass "All acceptance criteria verified, excellent implementation"

# Or fails QA with specific issues
*qa-fail "Missing TypeScript configuration in shared packages"
```

## Manual Fallback

If automation fails, provide the user with:

1. Exact GitHub CLI commands for issue management
2. QA Results section template for manual update
3. Quality assessment checklist
4. Bug report templates if issues found
