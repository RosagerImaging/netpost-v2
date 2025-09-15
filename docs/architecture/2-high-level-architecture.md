# 2. High Level Architecture

## Technical Summary

The project will be a modern full-stack application composed of a **Jamstack** frontend and a **Serverless** backend. Key components include a Next.js (React) web application, a React Native mobile app, a Python (FastAPI) serverless API, and a managed PostgreSQL database. This architecture directly supports the PRD goals of being AI-Native, cross-platform, and operationally lean for a solo founder.

## Platform and Infrastructure Choice

- **Platform:** **Vercel** (for frontend, serverless functions, and analytics) and **Supabase** (for database and authentication).
- **Key Services:** Vercel Serverless Functions (Python), Supabase Managed Postgres, Supabase Auth.
- **Deployment Host and Regions:** Vercel Edge Network (Global CDN) for the frontend and API; Supabase project hosted in a US region.

## Repository Structure

- **Structure:** Monorepo
- **Monorepo Tool:** Turborepo
- **Package Organization:** An `apps` directory will contain the `web`, `mobile`, and `api` applications. A `packages` directory will house shared configurations and frontend code.

## High Level Architecture Diagram

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

## Architectural Patterns

- **Jamstack Architecture:** The frontend will be a modern Jamstack application for optimal performance, scalability, and security.
- **Serverless Functions:** The backend API will be deployed as serverless functions to minimize operational overhead and auto-scale with demand.
- **Repository Pattern (Backend):** The backend will use the repository pattern to abstract all database interactions, simplifying testing and future changes.
