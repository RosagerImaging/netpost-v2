# NetPost V2 - Project Structure and Organization

## Repository Overview

- **Repository Type**: Monorepo using Turborepo
- **Main Directory**: `/home/optiks/dev/netpost-v2`
- **Primary Development**: `/home/optiks/dev/netpost-v2/ui-preview` (current focus)

## Root Directory Structure

```
netpost-v2/
├── .bmad-core/              # BMAD framework core files
├── .bmad-infrastructure-devops/  # DevOps configurations
├── .claude/                 # Claude-specific configurations
├── CLAUDE.md               # Comprehensive development guidelines
├── config/                 # Project configuration files
├── docs/                   # Project documentation
│   ├── PRD-final.md        # Product Requirements Document
│   ├── architecture.md     # System architecture overview
│   ├── prd/               # Detailed PRD sections
│   └── architecture/      # Detailed architecture docs
├── mcp.json               # MCP server configuration
├── non-bmad-docs/         # Additional documentation
├── ui-preview/            # *** MAIN DEVELOPMENT AREA ***
├── web-bundles/           # Web component bundles
└── .venv/                 # Python virtual environment (future use)
```

## UI Preview Structure (Main Development Area)

```
ui-preview/                 # Turborepo monorepo root
├── package.json           # Root package.json with workspaces
├── turbo.json            # Turborepo configuration
├── apps/                 # Applications
│   ├── web/              # *** Main Next.js Web App ***
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── app/          # Next.js App Router
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (app)/    # Protected routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── inventory/
│   │   │   │   ├── item-detail-editor/
│   │   │   │   └── settings/
│   │   │   └── (auth)/   # Authentication routes
│   │   │       └── login-sign-up/
│   │   └── components/   # React components
│   │       ├── dashboard/
│   │       ├── inventory/
│   │       ├── item-detail-editor/
│   │       ├── login-sign-up/
│   │       ├── settings/
│   │       └── shared/
│   └── docs/             # Documentation site
├── packages/             # Shared packages
│   ├── ui/              # *** Shared UI Component Library ***
│   │   └── src/
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       └── textarea.tsx
│   ├── lib/             # Shared utilities
│   ├── eslint-config/   # Shared ESLint configurations
│   └── typescript-config/  # Shared TypeScript configurations
```

## Key Configuration Files

### Root Level

- **`ui-preview/package.json`**: Main workspace configuration, dependencies, scripts
- **`ui-preview/turbo.json`**: Turborepo task configuration and caching
- **`CLAUDE.md`**: Comprehensive development guidelines and standards

### Web App (`apps/web/`)

- **`package.json`**: Web app specific dependencies and scripts
- **`next.config.js`**: Next.js configuration
- **`tailwind.config.js`**: Tailwind CSS configuration with custom colors and fonts
- **`eslint.config.js`**: ESLint configuration extending shared config
- **`tsconfig.json`**: TypeScript configuration

### Component Structure

```
components/
├── dashboard/           # Dashboard-specific components
│   ├── sales-chart.tsx
│   ├── stat-card.tsx
│   └── recent-activity.tsx
├── inventory/          # Inventory management components
│   ├── ItemEditorForm.tsx
│   └── ItemActionsPanel.tsx
├── item-detail-editor/ # Item editing components
│   ├── editor-form-left-column.tsx
│   ├── actions-panel-right-column.tsx
│   └── image-gallery.tsx
├── login-sign-up/      # Authentication components
├── settings/           # Settings components
└── shared/            # Shared/reusable components
    └── sidebar.tsx
```

## Planned Extensions (Not Yet Implemented)

```
apps/
├── mobile/            # React Native mobile app (planned)
└── api/              # Python FastAPI backend (planned)
```

## Package Management

- **Workspaces**: Defined in root `package.json`
- **Shared Dependencies**: Common packages in root `package.json`
- **App-Specific**: Each app has its own `package.json` for specific needs
- **Internal Packages**: `@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config`

## Development Patterns

### Import Patterns

- **Internal UI Components**: `from "@repo/ui"`
- **Relative Imports**: For local components and utilities
- **Absolute Imports**: Next.js supports absolute imports from project root

### File Naming Conventions

- **Components**: PascalCase (e.g., `ItemEditorForm.tsx`)
- **Utilities**: camelCase (e.g., `utils.ts`)
- **Configuration**: kebab-case (e.g., `next.config.js`)
- **Directories**: kebab-case (e.g., `item-detail-editor/`)

### Route Organization (Next.js App Router)

- **Route Groups**: `(app)` for authenticated routes, `(auth)` for public auth routes
- **Nested Routes**: Each feature has its own directory with `page.tsx`
- **Layouts**: `layout.tsx` files for shared layouts

## Build Output

- **Next.js**: Outputs to `.next/` directory
- **Turbo Cache**: Cached outputs for faster subsequent builds
- **Static Assets**: Served from `public/` directories

## Current Status

- **Active Development**: UI components and Next.js web app
- **In Progress**: Component library development, basic routing structure
- **Planned**: Backend API integration, mobile app development
- **Documentation**: Comprehensive PRD and architecture documents available
