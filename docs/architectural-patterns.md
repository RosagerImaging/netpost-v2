# Architectural Patterns

* **Jamstack Architecture:** The frontend will be a modern Jamstack application. This provides optimal performance, scalability, and security by serving static assets from a global CDN and using APIs for dynamic functionality.

* **Serverless Functions:** The backend API will be deployed as serverless functions. This aligns with the PRD, minimizes operational overhead, auto-scales with demand, and has a cost-effective pay-per-use model.

* **Repository Pattern (Backend):** The backend will use the repository pattern to abstract all database interactions. This decouples the business logic from the data access layer, which simplifies testing and makes future data source changes easier.
