# NetPost V2 - Code Style and Conventions

## General Development Philosophy
- **KISS Principle**: Keep It Simple, Stupid - prioritize straightforward solutions
- **YAGNI**: You Aren't Gonna Need It - implement features only when needed
- **Fail Fast**: Check for errors early and raise exceptions immediately
- **Single Responsibility**: Each function, class, and module should have one clear purpose

## File and Code Structure Limits
- **Maximum file length**: 500 lines of code (hard limit)
- **Maximum function length**: 50 lines with single, clear responsibility
- **Maximum class length**: 100 lines representing single concept
- **Line length**: 100 characters maximum

## Python Style Guidelines (Backend)
- **Code Style**: Follow PEP8 standards
- **Formatting**: Use `ruff format` (faster alternative to Black)
- **Type Hints**: Always use type hints for function signatures and class attributes
- **Data Validation**: Use Pydantic v2 for data validation and settings management
- **String Quotes**: Use double quotes for strings
- **Trailing Commas**: Use in multi-line structures

## TypeScript/JavaScript Style Guidelines (Frontend)
- **Language**: TypeScript for all code
- **React Version**: React 19.1.0 with new JSX transform
- **Styling**: Tailwind CSS utility-first approach
- **Component Architecture**: Custom component library with Radix UI primitives
- **State Management**: TBD (likely Context API or Zustand)

## Documentation Standards
- **Python Docstrings**: Use Google-style docstrings for all public functions, classes, and modules
- **TypeScript**: Use JSDoc comments for complex functions
- **Inline Comments**: Use `# Reason:` prefix for complex logic explanations
- **README Updates**: Required when features are added or dependencies change

## Naming Conventions

### Python (Backend)
- **Variables and functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private attributes/methods**: `_leading_underscore`
- **Type aliases**: `PascalCase`
- **Enum values**: `UPPER_SNAKE_CASE`

### TypeScript/JavaScript (Frontend)
- **Variables and functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `kebab-case` or `PascalCase` for components
- **Directories**: `kebab-case` (no spaces, use dashes)

## Database Naming Standards
- **Primary Keys**: Entity-specific (e.g., `session_id`, `lead_id`, `message_id`)
- **Foreign Keys**: `{referenced_entity}_id`
- **Timestamps**: `{action}_at` (created_at, updated_at, started_at, expires_at)
- **Booleans**: `is_{state}` (is_connected, is_active, is_qualified)
- **Counts**: `{entity}_count`
- **Durations**: `{property}_{unit}`

## Import Organization
- **Backend**: Prefer relative imports within packages
- **Frontend**: Standard ES6 imports
- **Environment Variables**: Use python_dotenv and load_env() for Python

## Error Handling
- **Custom Exceptions**: Create domain-specific exceptions
- **Context Managers**: Use for resource management
- **Structured Logging**: Use consistent logging format
- **Graceful Degradation**: Handle errors gracefully on frontend

## Testing Conventions
- **Test Location**: Tests live in `/tests` folder mirroring app structure
- **Test Files**: `test_*.py` for Python, `*.test.ts` for TypeScript
- **Test Coverage**: Aim for 80%+ coverage focusing on critical paths
- **Test Types**: Include expected use, edge case, and failure case tests
- **Fixtures**: Use `conftest.py` for shared Python fixtures

## Code Quality Tools
- **Python Linting**: Ruff for linting and formatting
- **Python Type Checking**: mypy
- **JavaScript/TypeScript**: ESLint with custom config
- **Code Formatting**: Prettier for TypeScript/JavaScript
- **Pre-commit Hooks**: Enforced code quality checks

## Architecture Patterns
- **Backend**: Repository pattern for database abstraction
- **Frontend**: Component composition with custom UI library
- **API Design**: RESTful with consistent parameter naming
- **Data Flow**: Unidirectional data flow patterns