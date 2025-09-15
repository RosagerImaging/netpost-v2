# NetPost V2 - Technology Stack and Development Tools

## Frontend Technologies

- **Framework**: Next.js 15.5.0 (React 19.1.0)
- **Language**: TypeScript 5.9.2
- **Styling**: Tailwind CSS 3.4.6
- **UI Components**: Custom component library (@repo/ui) + Radix UI primitives
- **Build Tool**: Turbo (Turborepo 2.5.6)
- **Mobile**: React Native (planned)

## UI Component Libraries

- **Radix UI Components**:
  - @radix-ui/react-checkbox, react-dropdown-menu, react-label
  - @radix-ui/react-select, react-slider, react-slot
  - @radix-ui/react-switch, react-tabs
- **Styling Utilities**:
  - class-variance-authority (CVA)
  - clsx
  - tailwind-merge
- **Icons**: lucide-react
- **Charts**: recharts

## Backend Technologies

- **Language**: Python
- **Framework**: FastAPI with Pydantic for data validation
- **Architecture**: Serverless Functions
- **Database**: PostgreSQL (managed via Supabase)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel Serverless Functions

## Development Tools

- **Package Manager**: npm 10.9.3
- **Node Version**: v22.18.0
- **Monorepo Tool**: Turborepo
- **Linting**: ESLint 9.34.0
- **Code Formatting**: Prettier 3.6.2
- **Type Checking**: TypeScript compiler

## Infrastructure & Hosting

- **Frontend Hosting**: Vercel
- **Backend Hosting**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **CDN**: Vercel Edge Network

## Repository Structure

- **Type**: Monorepo (Turborepo)
- **Apps Directory**: Contains web, mobile, and api applications
- **Packages Directory**: Shared configurations and frontend code
- **Main Apps**:
  - `web`: Next.js web application
  - `docs`: Documentation site
  - Planned: `mobile` (React Native), `api` (Python FastAPI)

## Testing Stack

- **Frontend Testing**: Jest (planned)
- **Backend Testing**: Pytest (planned)
- **E2E Testing**: Playwright (planned)
- **Testing Philosophy**: Full Testing Pyramid approach

## AI/ML Services

- **Primary AI Service**: OpenAI API (planned)
- **Use Cases**: Communication assistance, item descriptions, pricing suggestions, photo enhancement
