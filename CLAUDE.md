# CLAUDE.md

This file provides comprehensive guidance to Claude Code when working with Python code in this repository.

### 🔄 Project Awareness & Context
- **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `TASK.md`** before starting a new task. If the task isn’t listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.
- **Use venv_linux** (the virtual environment) whenever executing Python commands, including for unit tests.

### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
  For agents this looks like:
    - `agent.py` - Main agent definition and execution logic 
    - `tools.py` - Tool functions used by the agent 
    - `prompts.py` - System prompts
- **Use clear, consistent imports** (prefer relative imports within packages).
- **Use clear, consistent imports** (prefer relative imports within packages).
- **Use python_dotenv and load_env()** for environment variables.

### 🧪 Testing & Reliability
- **Always create Pytest unit tests for new features** (functions, classes, routes, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/tests` folder** mirroring the main app structure.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### ✅ Task Completion
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a “Discovered During Work” section.

### 📎 Style & Conventions
- **Use Python** as the primary language.
- **Follow PEP8**, use type hints, and format with `black`.
- **Use `pydantic` for data validation**.
- Use `FastAPI` for APIs and `SQLAlchemy` or `SQLModel` for ORM if applicable.
- Write **docstrings for every function** using the Google style:
  ```python
  def example():
      """
      Brief summary.

      Args:
          param1 (type): Description.

      Returns:
          type: Description.
      """
  ```

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified Python packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.

## Core Development Philosophy

### KISS (Keep It Simple, Stupid)

Simplicity should be a key goal in design. Choose straightforward solutions over complex ones whenever possible. Simple solutions are easier to understand, maintain, and debug.

### YAGNI (You Aren't Gonna Need It)

Avoid building functionality on speculation. Implement features only when they are needed, not when you anticipate they might be useful in the future.

### Design Principles

- **Dependency Inversion**: High-level modules should not depend on low-level modules. Both should depend on abstractions.
- **Open/Closed Principle**: Software entities should be open for extension but closed for modification.
- **Single Responsibility**: Each function, class, and module should have one clear purpose.
- **Fail Fast**: Check for potential errors early and raise exceptions immediately when issues occur.

## 🧱 Code Structure & Modularity

### File and Function Limits

- **Never create a file longer than 500 lines of code**. If approaching this limit, refactor by splitting into modules.
- **Functions should be under 50 lines** with a single, clear responsibility.
- **Classes should be under 100 lines** and represent a single concept or entity.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Line lenght should be max 100 characters** ruff rule in pyproject.toml
- **Use venv_linux** (the virtual environment) whenever executing Python commands, including for unit tests.

### Project Architecture

Follow strict vertical slice architecture with tests living next to the code they test:

```
src/project/
    __init__.py
    main.py
    tests/
        test_main.py
    conftest.py

    # Core modules
    database/
        __init__.py
        connection.py
        models.py
        tests/
            test_connection.py
            test_models.py

    auth/
        __init__.py
        authentication.py
        authorization.py
        tests/
            test_authentication.py
            test_authorization.py

    # Feature slices
    features/
        user_management/
            __init__.py
            handlers.py
            validators.py
            tests/
                test_handlers.py
                test_validators.py

        payment_processing/
            __init__.py
            processor.py
            gateway.py
            tests/
                test_processor.py
                test_gateway.py
```

## 🛠️ Development Environment

### UV Package Management

This project uses UV for blazing-fast Python package and environment management.

```bash
# Install UV (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment
uv venv

# Sync dependencies
uv sync

# Add a package ***NEVER UPDATE A DEPENDENCY DIRECTLY IN PYPROJECT.toml***
# ALWAYS USE UV ADD
uv add requests

# Add development dependency
uv add --dev pytest ruff mypy

# Remove a package
uv remove requests

# Run commands in the environment
uv run python script.py
uv run pytest
uv run ruff check .

# Install specific Python version
uv python install 3.12
```

### Development Commands

```bash
# Run all tests
uv run pytest

# Run specific tests with verbose output
uv run pytest tests/test_module.py -v

# Run tests with coverage
uv run pytest --cov=src --cov-report=html

# Format code
uv run ruff format .

# Check linting
uv run ruff check .

# Fix linting issues automatically
uv run ruff check --fix .

# Type checking
uv run mypy src/

# Run pre-commit hooks
uv run pre-commit run --all-files
```

## 📋 Style & Conventions

### Python Style Guide

- **Follow PEP8** with these specific choices:
  - Line length: 100 characters (set by Ruff in pyproject.toml)
  - Use double quotes for strings
  - Use trailing commas in multi-line structures
- **Always use type hints** for function signatures and class attributes
- **Format with `ruff format`** (faster alternative to Black)
- **Use `pydantic` v2** for data validation and settings management

### Docstring Standards

Use Google-style docstrings for all public functions, classes, and modules:

```python
def calculate_discount(
    price: Decimal,
    discount_percent: float,
    min_amount: Decimal = Decimal("0.01")
) -> Decimal:
    """
    Calculate the discounted price for a product.

    Args:
        price: Original price of the product
        discount_percent: Discount percentage (0-100)
        min_amount: Minimum allowed final price

    Returns:
        Final price after applying discount

    Raises:
        ValueError: If discount_percent is not between 0 and 100
        ValueError: If final price would be below min_amount

    Example:
        >>> calculate_discount(Decimal("100"), 20)
        Decimal('80.00')
    """
```

### Naming Conventions

- **Variables and functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private attributes/methods**: `_leading_underscore`
- **Type aliases**: `PascalCase`
- **Enum values**: `UPPER_SNAKE_CASE`

## 🧪 Testing Strategy

### Test-Driven Development (TDD)

1. **Write the test first** - Define expected behavior before implementation
2. **Watch it fail** - Ensure the test actually tests something
3. **Write minimal code** - Just enough to make the test pass
4. **Refactor** - Improve code while keeping tests green
5. **Repeat** - One test at a time

### Testing Best Practices

```python
# Always use pytest fixtures for setup
import pytest
from datetime import datetime

@pytest.fixture
def sample_user():
    """Provide a sample user for testing."""
    return User(
        id=123,
        name="Test User",
        email="test@example.com",
        created_at=datetime.now()
    )

# Use descriptive test names
def test_user_can_update_email_when_valid(sample_user):
    """Test that users can update their email with valid input."""
    new_email = "newemail@example.com"
    sample_user.update_email(new_email)
    assert sample_user.email == new_email

# Test edge cases and error conditions
def test_user_update_email_fails_with_invalid_format(sample_user):
    """Test that invalid email formats are rejected."""
    with pytest.raises(ValidationError) as exc_info:
        sample_user.update_email("not-an-email")
    assert "Invalid email format" in str(exc_info.value)
```

### Test Organization

- Unit tests: Test individual functions/methods in isolation
- Integration tests: Test component interactions
- End-to-end tests: Test complete user workflows
- Keep test files next to the code they test
- Use `conftest.py` for shared fixtures
- Aim for 80%+ code coverage, but focus on critical paths

## 🚨 Error Handling

### Exception Best Practices

```python
# Create custom exceptions for your domain
class PaymentError(Exception):
    """Base exception for payment-related errors."""
    pass

class InsufficientFundsError(PaymentError):
    """Raised when account has insufficient funds."""
    def __init__(self, required: Decimal, available: Decimal):
        self.required = required
        self.available = available
        super().__init__(
            f"Insufficient funds: required {required}, available {available}"
        )

# Use specific exception handling
try:
    process_payment(amount)
except InsufficientFundsError as e:
    logger.warning(f"Payment failed: {e}")
    return PaymentResult(success=False, reason="insufficient_funds")
except PaymentError as e:
    logger.error(f"Payment error: {e}")
    return PaymentResult(success=False, reason="payment_error")

# Use context managers for resource management
from contextlib import contextmanager

@contextmanager
def database_transaction():
    """Provide a transactional scope for database operations."""
    conn = get_connection()
    trans = conn.begin_transaction()
    try:
        yield conn
        trans.commit()
    except Exception:
        trans.rollback()
        raise
    finally:
        conn.close()
```

### Logging Strategy

```python
import logging
from functools import wraps

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Log function entry/exit for debugging
def log_execution(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        logger.debug(f"Entering {func.__name__}")
        try:
            result = func(*args, **kwargs)
            logger.debug(f"Exiting {func.__name__} successfully")
            return result
        except Exception as e:
            logger.exception(f"Error in {func.__name__}: {e}")
            raise
    return wrapper
```

## 🔧 Configuration Management

### Environment Variables and Settings

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings with validation."""
    app_name: str = "MyApp"
    debug: bool = False
    database_url: str
    redis_url: str = "redis://localhost:6379"
    api_key: str
    max_connections: int = 100

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

# Usage
settings = get_settings()
```

## 🏗️ Data Models and Validation

### Example Pydantic Models strict with pydantic v2

```python
from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

class ProductBase(BaseModel):
    """Base product model with common fields."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0, decimal_places=2)
    category: str
    tags: List[str] = []

    @validator('price')
    def validate_price(cls, v):
        if v > Decimal('1000000'):
            raise ValueError('Price cannot exceed 1,000,000')
        return v

    class Config:
        json_encoders = {
            Decimal: str,
            datetime: lambda v: v.isoformat()
        }

class ProductCreate(ProductBase):
    """Model for creating new products."""
    pass

class ProductUpdate(BaseModel):
    """Model for updating products - all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class Product(ProductBase):
    """Complete product model with database fields."""
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool = True

    class Config:
        from_attributes = True  # Enable ORM mode
```

## 🔄 Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions or fixes

### Commit Message Format

Never include claude code, or written by claude code in commit messages

```
<type>(<scope>): <subject>

<body>

<footer>
``
Types: feat, fix, docs, style, refactor, test, chore

Example:
```

feat(auth): add two-factor authentication

- Implement TOTP generation and validation
- Add QR code generation for authenticator apps
- Update user model with 2FA fields

Closes #123

````

## 🗄️ Database Naming Standards

### Entity-Specific Primary Keys
All database tables use entity-specific primary keys for clarity and consistency:

```sql
-- ✅ STANDARDIZED: Entity-specific primary keys
sessions.session_id UUID PRIMARY KEY
leads.lead_id UUID PRIMARY KEY
messages.message_id UUID PRIMARY KEY
daily_metrics.daily_metric_id UUID PRIMARY KEY
agencies.agency_id UUID PRIMARY KEY
````

### Field Naming Conventions

```sql
-- Primary keys: {entity}_id
session_id, lead_id, message_id

-- Foreign keys: {referenced_entity}_id
session_id REFERENCES sessions(session_id)
agency_id REFERENCES agencies(agency_id)

-- Timestamps: {action}_at
created_at, updated_at, started_at, expires_at

-- Booleans: is_{state}
is_connected, is_active, is_qualified

-- Counts: {entity}_count
message_count, lead_count, notification_count

-- Durations: {property}_{unit}
duration_seconds, timeout_minutes
```

### Repository Pattern Auto-Derivation

The enhanced BaseRepository automatically derives table names and primary keys:

```python
# ✅ STANDARDIZED: Convention-based repositories
class LeadRepository(BaseRepository[Lead]):
    def __init__(self):
        super().__init__()  # Auto-derives "leads" and "lead_id"

class SessionRepository(BaseRepository[AvatarSession]):
    def __init__(self):
        super().__init__()  # Auto-derives "sessions" and "session_id"
```

**Benefits**:

- ✅ Self-documenting schema
- ✅ Clear foreign key relationships
- ✅ Eliminates repository method overrides
- ✅ Consistent with entity naming patterns

### Model-Database Alignment

Models mirror database fields exactly to eliminate field mapping complexity:

```python
# ✅ STANDARDIZED: Models mirror database exactly
class Lead(BaseModel):
    lead_id: UUID = Field(default_factory=uuid4)  # Matches database field
    session_id: UUID                               # Matches database field
    agency_id: str                                 # Matches database field
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = ConfigDict(
        use_enum_values=True,
        populate_by_name=True,
        alias_generator=None  # Use exact field names
    )
```

### API Route Standards

```python
# ✅ STANDARDIZED: RESTful with consistent parameter naming
router = APIRouter(prefix="/api/v1/leads", tags=["leads"])

@router.get("/{lead_id}")           # GET /api/v1/leads/{lead_id}
@router.put("/{lead_id}")           # PUT /api/v1/leads/{lead_id}
@router.delete("/{lead_id}")        # DELETE /api/v1/leads/{lead_id}

# Sub-resources
@router.get("/{lead_id}/messages")  # GET /api/v1/leads/{lead_id}/messages
@router.get("/agency/{agency_id}")  # GET /api/v1/leads/agency/{agency_id}
```

For complete naming standards, see [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md).

## 📝 Documentation Standards

### Code Documentation

- Every module should have a docstring explaining its purpose
- Public functions must have complete docstrings
- Complex logic should have inline comments with `# Reason:` prefix
- Keep README.md updated with setup instructions and examples
- Maintain CHANGELOG.md for version history

### API Documentation

```python
from fastapi import APIRouter, HTTPException, status
from typing import List

router = APIRouter(prefix="/products", tags=["products"])

@router.get(
    "/",
    response_model=List[Product],
    summary="List all products",
    description="Retrieve a paginated list of all active products"
)
async def list_products(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None
) -> List[Product]:
    """
    Retrieve products with optional filtering.

    - **skip**: Number of products to skip (for pagination)
    - **limit**: Maximum number of products to return
    - **category**: Filter by product category
    """
    # Implementation here
```

## 🚀 Performance Considerations

### Optimization Guidelines

- Profile before optimizing - use `cProfile` or `py-spy`
- Use `lru_cache` for expensive computations
- Prefer generators for large datasets
- Use `asyncio` for I/O-bound operations
- Consider `multiprocessing` for CPU-bound tasks
- Cache database queries appropriately

### Example Optimization

```python
from functools import lru_cache
import asyncio
from typing import AsyncIterator

@lru_cache(maxsize=1000)
def expensive_calculation(n: int) -> int:
    """Cache results of expensive calculations."""
    # Complex computation here
    return result

async def process_large_dataset() -> AsyncIterator[dict]:
    """Process large dataset without loading all into memory."""
    async with aiofiles.open('large_file.json', mode='r') as f:
        async for line in f:
            data = json.loads(line)
            # Process and yield each item
            yield process_item(data)
```

## 🛡️ Security Best Practices

### Security Guidelines

- Never commit secrets - use environment variables
- Validate all user input with Pydantic
- Use parameterized queries for database operations
- Implement rate limiting for APIs
- Keep dependencies updated with `uv`
- Use HTTPS for all external communications
- Implement proper authentication and authorization

### Example Security Implementation

```python
from passlib.context import CryptContext
import secrets

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(length)
```

## 🔍 Debugging Tools

### Debugging Commands

```bash
# Interactive debugging with ipdb
uv add --dev ipdb
# Add breakpoint: import ipdb; ipdb.set_trace()

# Memory profiling
uv add --dev memory-profiler
uv run python -m memory_profiler script.py

# Line profiling
uv add --dev line-profiler
# Add @profile decorator to functions

# Debug with rich traceback
uv add --dev rich
# In code: from rich.traceback import install; install()
```

## 📊 Monitoring and Observability

### Structured Logging

```python
import structlog

logger = structlog.get_logger()

# Log with context
logger.info(
    "payment_processed",
    user_id=user.id,
    amount=amount,
    currency="USD",
    processing_time=processing_time
)
```

## 📚 Useful Resources

### Essential Tools

- UV Documentation: https://github.com/astral-sh/uv
- Ruff: https://github.com/astral-sh/ruff
- Pytest: https://docs.pytest.org/
- Pydantic: https://docs.pydantic.dev/
- FastAPI: https://fastapi.tiangolo.com/

### Python Best Practices

- PEP 8: https://pep8.org/
- PEP 484 (Type Hints): https://www.python.org/dev/peps/pep-0484/
- The Hitchhiker's Guide to Python: https://docs.python-guide.org/

## ⚠️ Important Notes

- **NEVER ASSUME OR GUESS** - When in doubt, ask for clarification
- **Always verify file paths and module names** before use
- **Keep CLAUDE.md updated** when adding new patterns or dependencies
- **Test your code** - No feature is complete without tests
- **Document your decisions** - Future developers (including yourself) will thank you

## 🔍 Search Command Requirements

**CRITICAL**: Always use `rg` (ripgrep) instead of traditional `grep` and `find` commands:

```bash
# ❌ Don't use grep
grep -r "pattern" .

# ✅ Use rg instead
rg "pattern"

# ❌ Don't use find with name
find . -name "*.py"

# ✅ Use rg with file filtering
rg --files | rg "\.py$"
# or
rg --files -g "*.py"
```

**Enforcement Rules:**

```
(
    r"^grep\b(?!.*\|)",
    "Use 'rg' (ripgrep) instead of 'grep' for better performance and features",
),
(
    r"^find\s+\S+\s+-name\b",
    "Use 'rg --files | rg pattern' or 'rg --files -g pattern' instead of 'find -name' for better performance",
),
```

## 🚀 GitHub Flow Workflow Summary

main (protected) ←── PR ←── feature/your-feature
↓ ↑
deploy development

### Daily Workflow:

1. git checkout main && git pull origin main
2. git checkout -b feature/new-feature
3. Make changes + tests
4. git push origin feature/new-feature
5. Create PR → Review → Merge to main

## Visual Development

### Design Principles
- Comprehensive design checklist in `~/dev/netpost-v2/.claude/context/design-principles.md`
- Brand style guide in `~/dev/netpost-v2/.claude/context/style-guide.md`
- When making visual (front-end, UI/UX) changes, always refer to these files for guidance

### Quick Visual Check
IMMEDIATELY after implementing any front-end change:
1. **Identify what changed** - Review the modified components/pages
2. **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
3. **Verify design compliance** - Compare against `/context/design-principles.md` and `/context/style-guide.md`
4. **Validate feature implementation** - Ensure the change fulfills the user's specific request
5. **Check acceptance criteria** - Review any provided context files or requirements
6. **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
7. **Check for errors** - Run `mcp__playwright__browser_console_messages`

This verification ensures changes meet design standards and user requirements.

### Comprehensive Design Review
Invoke the `@agent-design-review` subagent for thorough design validation when:
- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing

### S-Tier SaaS Dashboard Design Checklist (Inspired by Stripe, Airbnb, Linear)

#### I. Core Design Philosophy & Strategy

*   [ ] **Users First:** Prioritize user needs, workflows, and ease of use in every design decision.
*   [ ] **Meticulous Craft:** Aim for precision, polish, and high quality in every UI element and interaction.
*   [ ] **Speed & Performance:** Design for fast load times and snappy, responsive interactions.
*   [ ] **Simplicity & Clarity:** Strive for a clean, uncluttered interface. Ensure labels, instructions, and information are unambiguous.
*   [ ] **Focus & Efficiency:** Help users achieve their goals quickly and with minimal friction. Minimize unnecessary steps or distractions.
*   [ ] **Consistency:** Maintain a uniform design language (colors, typography, components, patterns) across the entire dashboard.
*   [ ] **Accessibility (WCAG AA+):** Design for inclusivity. Ensure sufficient color contrast, keyboard navigability, and screen reader compatibility.
*   [ ] **Opinionated Design (Thoughtful Defaults):** Establish clear, efficient default workflows and settings, reducing decision fatigue for users.

#### II. Design System Foundation (Tokens & Core Components)

*   [ ] **Define a Color Palette:**
    *   [ ] **Primary Brand Color:** User-specified, used strategically.
    *   [ ] **Neutrals:** A scale of grays (5-7 steps) for text, backgrounds, borders.
    *   [ ] **Semantic Colors:** Define specific colors for Success (green), Error/Destructive (red), Warning (yellow/amber), Informational (blue).
    *   [ ] **Dark Mode Palette:** Create a corresponding accessible dark mode palette.
    *   [ ] **Accessibility Check:** Ensure all color combinations meet WCAG AA contrast ratios.
*   [ ] **Establish a Typographic Scale:**
    *   [ ] **Primary Font Family:** Choose a clean, legible sans-serif font (e.g., Inter, Manrope, system-ui).
    *   [ ] **Modular Scale:** Define distinct sizes for H1, H2, H3, H4, Body Large, Body Medium (Default), Body Small/Caption. (e.g., H1: 32px, Body: 14px/16px).
    *   [ ] **Font Weights:** Utilize a limited set of weights (e.g., Regular, Medium, SemiBold, Bold).
    *   [ ] **Line Height:** Ensure generous line height for readability (e.g., 1.5-1.7 for body text).
*   [ ] **Define Spacing Units:**
    *   [ ] **Base Unit:** Establish a base unit (e.g., 8px).
    *   [ ] **Spacing Scale:** Use multiples of the base unit for all padding, margins, and layout spacing (e.g., 4px, 8px, 12px, 16px, 24px, 32px).
*   [ ] **Define Border Radii:**
    *   [ ] **Consistent Values:** Use a small set of consistent border radii (e.g., Small: 4-6px for inputs/buttons; Medium: 8-12px for cards/modals).
*   [ ] **Develop Core UI Components (with consistent states: default, hover, active, focus, disabled):**
    *   [ ] Buttons (primary, secondary, tertiary/ghost, destructive, link-style; with icon options)
    *   [ ] Input Fields (text, textarea, select, date picker; with clear labels, placeholders, helper text, error messages)
    *   [ ] Checkboxes & Radio Buttons
    *   [ ] Toggles/Switches
    *   [ ] Cards (for content blocks, multimedia items, dashboard widgets)
    *   [ ] Tables (for data display; with clear headers, rows, cells; support for sorting, filtering)
    *   [ ] Modals/Dialogs (for confirmations, forms, detailed views)
    *   [ ] Navigation Elements (Sidebar, Tabs)
    *   [ ] Badges/Tags (for status indicators, categorization)
    *   [ ] Tooltips (for contextual help)
    *   [ ] Progress Indicators (Spinners, Progress Bars)
    *   [ ] Icons (use a single, modern, clean icon set; SVG preferred)
    *   [ ] Avatars

#### III. Layout, Visual Hierarchy & Structure

*   [ ] **Responsive Grid System:** Design based on a responsive grid (e.g., 12-column) for consistent layout across devices.
*   [ ] **Strategic White Space:** Use ample negative space to improve clarity, reduce cognitive load, and create visual balance.
*   [ ] **Clear Visual Hierarchy:** Guide the user's eye using typography (size, weight, color), spacing, and element positioning.
*   [ ] **Consistent Alignment:** Maintain consistent alignment of elements.
*   [ ] **Main Dashboard Layout:**
    *   [ ] Persistent Left Sidebar: For primary navigation between modules.
    *   [ ] Content Area: Main space for module-specific interfaces.
    *   [ ] (Optional) Top Bar: For global search, user profile, notifications.
*   [ ] **Mobile-First Considerations:** Ensure the design adapts gracefully to smaller screens.

#### IV. Interaction Design & Animations

*   [ ] **Purposeful Micro-interactions:** Use subtle animations and visual feedback for user actions (hovers, clicks, form submissions, status changes).
    *   [ ] Feedback should be immediate and clear.
    *   [ ] Animations should be quick (150-300ms) and use appropriate easing (e.g., ease-in-out).
*   [ ] **Loading States:** Implement clear loading indicators (skeleton screens for page loads, spinners for in-component actions).
*   [ ] **Transitions:** Use smooth transitions for state changes, modal appearances, and section expansions.
*   [ ] **Avoid Distraction:** Animations should enhance usability, not overwhelm or slow down the user.
*   [ ] **Keyboard Navigation:** Ensure all interactive elements are keyboard accessible and focus states are clear.

#### V. Specific Module Design Tactics

##### A. Multimedia Moderation Module

*   [ ] **Clear Media Display:** Prominent image/video previews (grid or list view).
*   [ ] **Obvious Moderation Actions:** Clearly labeled buttons (Approve, Reject, Flag, etc.) with distinct styling (e.g., primary/secondary, color-coding). Use icons for quick recognition.
*   [ ] **Visible Status Indicators:** Use color-coded Badges for content status (Pending, Approved, Rejected).
*   [ ] **Contextual Information:** Display relevant metadata (uploader, timestamp, flags) alongside media.
*   [ ] **Workflow Efficiency:**
    *   [ ] Bulk Actions: Allow selection and moderation of multiple items.
    *   [ ] Keyboard Shortcuts: For common moderation actions.
*   [ ] **Minimize Fatigue:** Clean, uncluttered interface; consider dark mode option.

##### B. Data Tables Module (Contacts, Admin Settings)

*   [ ] **Readability & Scannability:**
    *   [ ] Smart Alignment: Left-align text, right-align numbers.
    *   [ ] Clear Headers: Bold column headers.
    *   [ ] Zebra Striping (Optional): For dense tables.
    *   [ ] Legible Typography: Simple, clean sans-serif fonts.
    *   [ ] Adequate Row Height & Spacing.
*   [ ] **Interactive Controls:**
    *   [ ] Column Sorting: Clickable headers with sort indicators.
    *   [ ] Intuitive Filtering: Accessible filter controls (dropdowns, text inputs) above the table.
    *   [ ] Global Table Search.
*   [ ] **Large Datasets:**
    *   [ ] Pagination (preferred for admin tables) or virtual/infinite scroll.
    *   [ ] Sticky Headers / Frozen Columns: If applicable.
*   [ ] **Row Interactions:**
    *   [ ] Expandable Rows: For detailed information.
    *   [ ] Inline Editing: For quick modifications.
    *   [ ] Bulk Actions: Checkboxes and contextual toolbar.
    *   [ ] Action Icons/Buttons per Row: (Edit, Delete, View Details) clearly distinguishable.

##### C. Configuration Panels Module (Microsite, Admin Settings)

*   [ ] **Clarity & Simplicity:** Clear, unambiguous labels for all settings. Concise helper text or tooltips for descriptions. Avoid jargon.
*   [ ] **Logical Grouping:** Group related settings into sections or tabs.
*   [ ] **Progressive Disclosure:** Hide advanced or less-used settings by default (e.g., behind "Advanced Settings" toggle, accordions).
*   [ ] **Appropriate Input Types:** Use correct form controls (text fields, checkboxes, toggles, selects, sliders) for each setting.
*   [ ] **Visual Feedback:** Immediate confirmation of changes saved (e.g., toast notifications, inline messages). Clear error messages for invalid inputs.
*   [ ] **Sensible Defaults:** Provide default values for all settings.
*   [ ] **Reset Option:** Easy way to "Reset to Defaults" for sections or entire configuration.
*   [ ] **Microsite Preview (If Applicable):** Show a live or near-live preview of microsite changes.

#### VI. CSS & Styling Architecture

*   [ ] **Choose a Scalable CSS Methodology:**
    *   [ ] **Utility-First (Recommended for LLM):** e.g., Tailwind CSS. Define design tokens in config, apply via utility classes.
    *   [ ] **BEM with Sass:** If not utility-first, use structured BEM naming with Sass variables for tokens.
    *   [ ] **CSS-in-JS (Scoped Styles):** e.g., Stripe's approach for Elements.
*   [ ] **Integrate Design Tokens:** Ensure colors, fonts, spacing, radii tokens are directly usable in the chosen CSS architecture.
*   [ ] **Maintainability & Readability:** Code should be well-organized and easy to understand.
*   [ ] **Performance:** Optimize CSS delivery; avoid unnecessary bloat.

#### VII. General Best Practices

*   [ ] **Iterative Design & Testing:** Continuously test with users and iterate on designs.
*   [ ] **Clear Information Architecture:** Organize content and navigation logically.
*   [ ] **Responsive Design:** Ensure the dashboard is fully functional and looks great on all device sizes (desktop, tablet, mobile).
*   [ ] **Documentation:** Maintain clear documentation for the design system and components.

# Universal Problem-Solving Framework

## Core Principle: The Two-Stage Recognition Pattern

### Stage 1: Initial Solution Attempt

When encountering any problem, my first instinct generates a solution based on the immediate error or issue presented. This is natural and often correct, but requires a critical evaluation pause.

### Stage 2: Root Cause Analysis (The Critical Pivot)

**Before committing to implementation**, I must pause and ask:

- **"Am I fixing the symptom or the cause?"**
- **"What environmental constraints am I operating within?"**
- **"Is this solution robust or fragile?"**

## The Decision Tree

```
Problem Identified
    ↓
Initial Solution Conceived
    ↓
CRITICAL PAUSE - Evaluate:
    ├─ Will this solution work in ALL expected scenarios?
    ├─ Am I adding complexity to patch a symptom?
    ├─ Are there environmental constraints I'm fighting against?
    └─ Is there a simpler, more fundamental approach?
        ↓
    If ANY answer suggests fragility:
        → IMMEDIATE PIVOT
        → Identify root cause
        → Design robust solution
        → Implement with confidence
```

## Key Recognition Patterns

### 🚩 Red Flags That Demand a Pivot

1. **Conditional Patches**: If I'm adding `if/else` checks to handle edge cases, I'm likely treating symptoms
2. **Environmental Fighting**: If I'm trying to force something to work despite the environment (like runtime configs in static contexts)
3. **Cascading Complexity**: If the fix requires multiple subsequent fixes
4. **Uncertainty Stacking**: If I'm unsure whether the solution will work and adding "just in case" code

### ✅ Green Flags of Robust Solutions

1. **Environmental Harmony**: Solution works WITH the constraints, not against them
2. **Simplicity Through Understanding**: Often MORE simple than the initial patch
3. **Predictable Behavior**: No uncertainty about whether it will work
4. **Single Source of Truth**: Eliminates dependency chains

## Application Examples Across Domains

### Programming/Technical

- **Symptom Fix**: Adding try/catch around failing code
- **Root Fix**: Understanding why the code fails and preventing the error condition

### Communication/Writing

- **Symptom Fix**: Adding more explanation when something is unclear
- **Root Fix**: Restructuring the information flow to be inherently clear

### Planning/Strategy

- **Symptom Fix**: Adding more resources to a failing project
- **Root Fix**: Identifying why the project structure is inefficient

### Data Analysis

- **Symptom Fix**: Cleaning outliers from messy data
- **Root Fix**: Understanding why the data collection process produces outliers

## The Pivot Moment

The most critical skill is recognizing **the pivot moment** - that instant where you realize your initial approach has fundamental issues. This recognition should trigger:

1. **Immediate Stop**: Don't continue down the fragile path
2. **Step Back**: Look at the problem from a higher level
3. **Identify Constraints**: What can't be changed about the environment?
4. **Redesign**: Create a solution that works within those constraints
5. **Confidence**: The new solution should feel obviously correct

## Mental Model: "The Carpenter's Rule"

*"A skilled carpenter doesn't add more nails to fix a wobbly table; they identify which leg is uneven and address the fundamental imbalance."*

## Implementation Checklist

Before implementing ANY solution, ask:

- [ ] Is this addressing the root cause?
- [ ] Will this work reliably in the target environment?
- [ ] Am I adding complexity that suggests a deeper issue?
- [ ] Would I need to explain exceptions or edge cases?
- [ ] Does this solution feel elegant or forced?

If any answer is concerning, **STOP AND PIVOT**.

## Cognitive Trigger Phrase

When facing any problem, activate this framework with:

**"First instinct generated. Now - symptom or cause?"**

This phrase triggers the critical evaluation that separates good solutions from great ones.

---

## Note on Application

This framework applies to:

- Technical problem-solving
- Design decisions  
- Communication strategies
- Planning and logistics
- Analysis and research
- Creative solutions
- Interpersonal situations
- Any scenario requiring a solution to a problem

The key is universal: **Recognize when you're patching symptoms, pivot immediately to address causes, and choose robustness over cleverness.**

---

_This document is a living guide. Update it as the project evolves and new patterns emerge._
