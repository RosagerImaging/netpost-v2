# NetPost V2 - Task Completion and Quality Assurance Workflow

## Task Completion Checklist

### Before Starting Any Task
1. **Read Documentation**
   - Always read `PLANNING.md` at start of conversation (when available)
   - Check `TASK.md` before starting new tasks (when available)
   - Follow consistent naming conventions and architecture patterns

2. **Environment Setup**
   - Use Node.js v22.18.0+ and npm 10.9.3+
   - Ensure you're in the correct directory (`/home/optiks/dev/netpost-v2/ui-preview`)
   - Install dependencies if not already done: `npm install`

### During Development

#### Code Quality Standards
- **File Size**: Never create files longer than 500 lines
- **Function Size**: Keep functions under 50 lines with single responsibility
- **Line Length**: Maximum 100 characters
- **Type Safety**: Always use TypeScript with proper type annotations

#### Code Style Requirements
- **Frontend**: Follow ESLint configuration and Prettier formatting
- **Naming**: Use consistent naming conventions (camelCase for variables, PascalCase for components)
- **Documentation**: Add JSDoc comments for complex functions
- **Imports**: Use clean, consistent import organization

### After Making Code Changes (MANDATORY)

#### 1. Code Linting and Formatting
```bash
# Run linting (must pass)
npm run lint

# If using turbo globally
turbo lint
```

#### 2. Type Checking
```bash
# Check TypeScript types (must pass)
npm run check-types

# If using turbo globally
turbo check-types
```

#### 3. Build Verification
```bash
# Ensure code builds successfully
npm run build

# If using turbo globally
turbo build
```

#### 4. Testing (When Tests Exist)
```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage
```

### Task Documentation

#### Update Task Tracking
- Mark completed tasks in `TASK.md` immediately after finishing (when file exists)
- Add new sub-tasks or TODOs discovered during development
- Use "Discovered During Work" section for new items found

#### Documentation Updates
- Update `README.md` when:
  - New features are added
  - Dependencies change
  - Setup steps are modified
- Comment non-obvious code with `// Reason:` prefix explaining the why
- Ensure everything is understandable to mid-level developer

### Quality Gates

#### Never Commit If:
- Linting fails (`npm run lint`)
- Type checking fails (`npm run check-types`)
- Build fails (`npm run build`)
- Existing tests fail (`npm run test`)
- Code exceeds file/function size limits

#### Always Verify:
- New components follow existing patterns
- Dependencies are properly added to `package.json`
- No hardcoded values that should be configurable
- Error handling is implemented for user-facing features
- Accessibility considerations are addressed

### Backend Development (When Added)

#### Python-Specific Requirements
- Use `uv` for package management
- Run in virtual environment: `uv run <command>`
- Follow PEP8 with Ruff formatting: `uv run ruff format .`
- Type checking: `uv run mypy src/`
- Testing: `uv run pytest`

#### Testing Requirements
- Create Pytest unit tests for new features
- Include at least:
  - 1 test for expected use
  - 1 edge case test  
  - 1 failure case test
- Tests should live in `/tests` folder mirroring app structure

### Git Workflow

#### Commit Standards
- Never include "claude code" or "written by claude code" in commit messages
- Use conventional commit format: `<type>(<scope>): <subject>`
- Types: feat, fix, docs, style, refactor, test, chore

#### Before Pushing
- Ensure all quality gates pass
- Review changes for sensitive information
- Verify no debug code or console.logs remain
- Check that imports are correct and files exist

### Troubleshooting Common Issues

#### Build Failures
- Check for TypeScript errors: `npm run check-types`
- Verify all imports exist and are correct
- Ensure all dependencies are installed
- Clear cache: `rm -rf .next node_modules && npm install`

#### Linting Issues
- Run `npm run lint` to see specific issues
- Many issues can be auto-fixed with appropriate tools
- Check ESLint configuration in project

#### Development Server Issues
- Check if port 3000 is available: `lsof -i :3000`
- Kill conflicting processes if needed
- Try restarting with `npm run dev`

### AI Behavior Rules
- **Never assume missing context** - Ask questions if uncertain
- **Never hallucinate libraries or functions** - Only use verified packages
- **Always confirm file paths** exist before referencing in code
- **Never delete/overwrite existing code** unless explicitly instructed

### Performance Considerations
- Optimize imports (use tree-shaking friendly imports)
- Implement proper error boundaries
- Use React best practices (memo, callback optimization where appropriate)
- Consider mobile performance for responsive components