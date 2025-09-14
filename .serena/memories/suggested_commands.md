# NetPost V2 - Essential Development Commands

## Prerequisites
- **Node.js**: v22.18.0 or higher
- **npm**: 10.9.3 or higher  
- **Python**: 3.12+ (for backend when implemented)
- **UV**: For Python package management (when backend is added)

## Project Setup Commands

### Initial Setup
```bash
# Clone and enter project
cd /home/optiks/dev/netpost-v2/ui-preview

# Install dependencies
npm install

# Install dependencies for all workspaces
npm install --workspaces
```

## Daily Development Commands

### Development Server
```bash
# Start all apps in development mode
npm run dev

# Start specific app (web)
npm run dev --filter=web
# OR using turbo directly
turbo dev --filter=web

# Start with different port (if needed)
# Edit package.json or use PORT environment variable
```

### Building
```bash
# Build all apps and packages
npm run build

# Build specific app
npm run build --filter=web
# OR
turbo build --filter=web
```

### Code Quality
```bash
# Run linting for all packages
npm run lint

# Run linting for specific package
npm run lint --filter=web

# Check TypeScript types
npm run check-types

# Format code
npm run format
```

## Turborepo-Specific Commands

### Using Global Turbo (Recommended)
```bash
# Install global turbo
npm install -g turbo

# Then use turbo directly
turbo dev
turbo build
turbo lint
turbo check-types
```

### Package Management
```bash
# Add dependency to specific workspace
npm install <package> --workspace=web

# Add dev dependency
npm install <package> --save-dev --workspace=web

# Remove dependency
npm uninstall <package> --workspace=web
```

## Future Commands (When Backend is Added)

### Python Development (Using UV)
```bash
# Create virtual environment
uv venv

# Sync dependencies
uv sync

# Add package
uv add requests

# Add dev dependency
uv add --dev pytest ruff mypy

# Run Python commands
uv run python script.py
uv run pytest
uv run ruff check .
uv run ruff format .
uv run mypy src/
```

## Testing Commands (Planned)

### Frontend Testing
```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- tests/specific-test.ts

# Run tests with coverage
npm run test -- --coverage
```

### Backend Testing (When Added)
```bash
# Run all Python tests
uv run pytest

# Run specific tests with verbose output
uv run pytest tests/test_module.py -v

# Run tests with coverage
uv run pytest --cov=src --cov-report=html
```

## Git Workflow Commands
```bash
# Standard workflow
git checkout main && git pull origin main
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create PR through GitHub
```

## Useful System Commands (Linux)
```bash
# Use ripgrep instead of grep/find
rg "pattern"                    # Search for pattern
rg --files -g "*.tsx"          # Find TypeScript React files
rg "pattern" --type js         # Search in JavaScript files only

# Directory navigation
ls -la                         # List all files with details
ls -la ui-preview/apps/        # List apps directory
```

## Environment Management
```bash
# Check versions
node --version
npm --version
python --version  # When backend is added

# Check what's running on ports
netstat -tulpn | grep LISTEN
lsof -i :3000  # Check what's using port 3000
```

## Debugging Commands
```bash
# Check build output
npm run build --filter=web 2>&1 | tee build.log

# Check dependency tree
npm ls --depth=0

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Task Completion Commands (After Code Changes)
```bash
# Always run after making changes:
npm run lint
npm run check-types  
npm run build

# If tests exist:
npm run test
```

## Notes
- Always use the monorepo-aware commands (with --filter or --workspace)
- Prefer `turbo` commands when available (faster due to caching)
- Use `rg` (ripgrep) instead of `grep` or `find` for better performance
- The project follows a Turborepo monorepo structure with shared packages