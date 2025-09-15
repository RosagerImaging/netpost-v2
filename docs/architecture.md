# AI-Native Reselling Assistant Fullstack Architecture Document

## 1. Introduction

This document outlines the complete fullstack architecture for the AI-Native Reselling Assistant. It serves as the single source of truth for development. We will use a modern monorepo starter template like **Turborepo** to accelerate development and enforce best practices.

### Change Log

| Date       | Version | Description                                  | Author              |
| :--------- | :------ | :------------------------------------------- | :------------------ |
| 2025-09-12 | 1.0     | Initial architecture draft created from PRD. | Winston (Architect) |

## 2. High Level Architecture

### Technical Summary

The project will be a modern full-stack application composed of a **Jamstack** frontend and a **Serverless** backend. Key components include a Next.js (React) web application, a React Native mobile app, a Python (FastAPI) serverless API, and a managed PostgreSQL database. This architecture directly supports the PRD goals of being AI-Native, cross-platform, and operationally lean for a solo founder.

### Platform and Infrastructure Choice

- **Platform:** **Vercel** (for frontend, serverless functions, and analytics) and **Supabase** (for database and authentication).
- **Key Services:** Vercel Serverless Functions (Python), Supabase Managed Postgres, Supabase Auth.
- **Deployment Host and Regions:** Vercel Edge Network (Global CDN) for the frontend and API; Supabase project hosted in a US region.

### Repository Structure

- **Structure:** Monorepo
- **Monorepo Tool:** Turborepo
- **Package Organization:** An `apps` directory will contain the `web`, `mobile`, and `api` applications. A `packages` directory will house shared configurations and frontend code.

### High Level Architecture Diagram

```
graph TD
    subgraph User
        Browser; Mobile[Mobile App];
    end
    subgraph Vercel Platform
        CDN[Edge Network] --> Frontend[Next.js App]; API[Python API];
    end
    subgraph Supabase Platform
        Auth; DB[(Postgres)];
    end
    subgraph Third Parties
        Marketplaces[Marketplace APIs]; AIService[AI Service API];
    end
    Browser --> CDN; Mobile --> API; Frontend --> API;
    API -- Manages --> Auth; API -- R/W --> DB;
    API -- Calls --> Marketplaces; API -- Calls --> AIService;
```

### Architectural Patterns

- **Jamstack Architecture:** The frontend will be a modern Jamstack application for optimal performance, scalability, and security.
- **Serverless Functions:** The backend API will be deployed as serverless functions to minimize operational overhead and auto-scale with demand.
- **Repository Pattern (Backend):** The backend will use the repository pattern to abstract all database interactions, simplifying testing and future changes.

## 3. Tech Stack

_(A detailed table specifying versions for TypeScript, Next.js, React Native, Shadcn/ui, Tailwind CSS, Python, FastAPI, Pydantic, PostgreSQL, Supabase, Jest, Pytest, Playwright, Vercel, etc.)_

## 4. Data Models

_(Defines the core `User`, `InventoryItem`, `Listing`, and `MarketplaceConnection` models with their key attributes and corresponding TypeScript interfaces.)_

## 5. API Specification

_(Provides a foundational OpenAPI 3.0 (YAML) specification for the REST API, detailing key endpoints like `/inventory-items` and `/listings` and defining security schemes.)_

## 6. Components

_(Breaks the system down into 5 logical components: Frontend Web App, Mobile Sourcing App, Backend API, Authentication Service, and Database, detailing the responsibility and technology for each.)_

## 7. External APIs

_(Details the three categories of required external APIs: Marketplace APIs (eBay, Poshmark), the AI Service API (OpenAI, etc.), and a Product Data API for SKU lookups.)_

## 8. Core Workflows

_(Includes Mermaid sequence diagrams for the two most critical user journeys: "Sourcing a New Item & Real-Time Sync" and "Cross-Listing an Item to Multiple Marketplaces.")_

## 9. Database Schema

_(Provides the concrete SQL DDL for the PostgreSQL database, including `CREATE TABLE` statements for all data models, foreign key relationships, and performance indexes.)_

## 10. Unified Project Structure

_(Presents a detailed ASCII tree diagram for the Turborepo monorepo, showing the layout of the `apps` (web, mobile, api) and `packages` (ui, config, shared-types) directories.)_

## 11. Development Workflow

_(Outlines the practical steps for local development, including prerequisite tools, setup commands, development scripts (`npm run dev`), and a template for required environment variables.)_

## 12. Deployment Architecture

_(Details the CI/CD pipeline using Vercel's Git-native workflow for automated preview and production deployments. Defines the `Development`, `Preview`, and `Production` environments.)_

## 13. Security and Performance

_(Translates NFRs into specific strategies, including using a Content Security Policy, `httpOnly` cookies for tokens, Pydantic for input validation, and leveraging Vercel's Edge Caching and Next.js's code-splitting for performance.)_

## 14. Testing Strategy

_(Defines the "Full Testing Pyramid" approach, detailing the organization for frontend (Jest), backend (Pytest), and E2E (Playwright) tests, including code examples for each.)_

## 15. Coding Standards

_(Lists a minimal, critical set of rules for AI and human developers, covering API contract adherence, environment variable access, centralized API logic, and naming conventions.)_

## 16. Error Handling Strategy

_(Provides a unified strategy with a sequence diagram for the error flow, a standard JSON error format, and code examples for handling errors gracefully on both the frontend and backend.)_

## 17. Monitoring and Observability

_(Outlines the monitoring stack, leveraging Vercel Analytics, Supabase Dashboards, and a dedicated service like Sentry for comprehensive error tracking and performance monitoring.)_
