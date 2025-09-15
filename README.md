# NetPost V2 - AI-Native Reselling Assistant Platform

Transform your reselling workflow with intelligent automation, cross-platform management, and data-driven insights.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0 or later
- npm 10.2.4 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/RosagerImaging/netpost-v2.git
cd netpost-v2

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

This is a Turborepo monorepo with the following structure:

```
netpost-v2/
├── apps/
│   ├── web/          # Next.js web application
│   ├── mobile/       # React Native app (placeholder)
│   └── api/          # Python FastAPI backend (placeholder)
├── packages/
│   ├── ui/           # Shared component library
│   ├── config/       # Shared configurations (Tailwind, TS, ESLint)
│   └── shared-types/ # TypeScript type definitions
├── docs/             # Project documentation
└── package.json      # Workspace configuration
```

### Apps

- **`web`**: Next.js 15.5 application with TypeScript, Tailwind CSS, and App Router
- **`mobile`**: React Native application (coming soon)
- **`api`**: Python FastAPI backend (coming soon)

### Packages

- **`@netpost/ui`**: Shared React component library built with Shadcn/ui and Tailwind CSS
- **`@netpost/config`**: Shared configuration for Tailwind, TypeScript, and ESLint
- **`@netpost/shared-types`**: TypeScript type definitions for User, Item, Listing, and API entities

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start all packages in development mode
npm run build        # Build all packages for production
npm run lint         # Lint all packages
npm run format       # Format code with Prettier
npm run type-check   # Type check all packages

# Individual package development
cd apps/web && npm run dev       # Start only web app
cd packages/ui && npm run build  # Build only UI package
```

### Development Workflow

1. **Start the development server**: `npm run dev`
2. **Make changes** to any package (ui, config, shared-types, web)
3. **Hot reload** will automatically refresh the browser
4. **Packages rebuild** automatically when their source files change

### Adding Dependencies

```bash
# Add to web app
cd apps/web && npm install <package>

# Add to UI package
cd packages/ui && npm install <package>

# Add to root (for development tools)
npm install <package> --save-dev
```

## 🎨 Design System

NetPost V2 uses a custom design system built on Tailwind CSS with the following brand colors:

- **Primary**: `#00BFFF` (DeepSkyBlue) - Used for primary actions and branding
- **Accent**: `#FFD700` (Gold) - Used for highlights and secondary actions
- **Typography**: Inter font family with deliberate sizing scale
- **Layout**: 8-point grid system for consistent spacing
- **Components**: Built on Shadcn/ui for accessibility and consistency

### Using Design System

```tsx
import { Button, Card, Input } from "@netpost/ui";

// Primary action button
<Button>Get Started</Button>

// Secondary action
<Button variant="outline">Learn More</Button>

// Card with glassmorphism effect
<Card className="glass">
  <CardContent>...</CardContent>
</Card>
```

## 🏗️ Architecture

### Frontend Stack

- **Framework**: Next.js 15.5 with App Router
- **Styling**: Tailwind CSS with custom design tokens
- **Components**: Shadcn/ui + custom component library
- **State Management**: React state (Zustand/Redux coming soon)
- **Deployment**: Vercel (optimized for Next.js)

### Monorepo Management

- **Tool**: Turborepo for build system and caching
- **Package Manager**: npm with workspaces
- **Build Pipeline**: Parallel builds with dependency awareness
- **Development**: Hot reload across all packages

### Code Quality

- **TypeScript**: Strict type checking across all packages
- **ESLint**: Consistent linting rules
- **Prettier**: Automated code formatting
- **Git Hooks**: Pre-commit quality checks (coming soon)

## 📦 Package Details

### @netpost/ui

Shared React component library with:

- Button (Primary, Secondary, Destructive, Ghost, Link variants)
- Input (Text, Email, Password, etc.)
- Card (Header, Content, Footer components)
- Utilities (cn for class name merging)

### @netpost/config

Shared configuration exports:

- `netpostTailwindConfig`: Tailwind configuration with design tokens
- `baseTypescriptConfig`: Base TypeScript configuration
- `nextTypescriptConfig`: Next.js specific TypeScript configuration
- `baseEslintConfig`: Base ESLint configuration
- `nextEslintConfig`: Next.js specific ESLint configuration

### @netpost/shared-types

TypeScript definitions for:

- **User**: User profiles, authentication, preferences
- **Item**: Inventory items, categories, conditions, analysis
- **Listing**: Platform listings, cross-posting, analytics
- **API**: Request/response types, pagination, errors

## 🚢 Deployment

### Production Build

```bash
npm run build
```

This builds all packages in the correct order with Turborepo's dependency management.

### Deployment Targets

- **Web App**: Vercel (recommended) or any Node.js hosting
- **UI Package**: npm registry for sharing across projects
- **Mobile App**: App Store / Google Play (coming soon)
- **API**: Docker containers on cloud platforms (coming soon)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific package tests
cd packages/ui && npm run test
cd apps/web && npm run test
```

Testing framework setup:

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright (coming soon)
- **Component Tests**: Storybook (coming soon)

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run quality checks**: `npm run lint && npm run type-check`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow the established code style (Prettier + ESLint)
- Add TypeScript types for all new code
- Write tests for new components and utilities
- Update documentation for significant changes
- Use conventional commit messages

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Create an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🗺️ Roadmap

### Phase 1: Foundation (Current)
- ✅ Turborepo monorepo setup
- ✅ Next.js web application
- ✅ Shared UI component library
- ✅ Design system implementation
- ✅ TypeScript configurations

### Phase 2: Core Features (Next)
- 🔄 User authentication and profiles
- 🔄 Item inventory management
- 🔄 AI-powered item analysis
- 🔄 Platform integrations

### Phase 3: Advanced Features
- 📅 Cross-platform listing automation
- 📅 Analytics and insights dashboard
- 📅 Mobile application
- 📅 API ecosystem

---

Built with ❤️ by the NetPost team using Next.js, Turborepo, and Tailwind CSS.