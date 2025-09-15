# Information Architecture (IA)

## Site Map / Screen Inventory

This site map illustrates the primary screens of the application and their relationship to one another. It is based on the core screens identified in the PRD.

```mermaid
graph TD
    subgraph Pre-Authentication
        A[Login / Sign-up]
    end

    subgraph Post-Authentication
        B[Dashboard] --> C[Inventory List]
        C --> D[Item Detail / Editor]
        B --> E[AI Assistant View]
        B --> F[Marketplace Integrations]
        B --> G[Settings]
        G --> G1[account Info]
        G --> G2[Display Settings]
        G --> G3[AI Controls]
    end

    A --> B
```

## Navigation Structure

**Primary Navigation**: After logging in, the main navigation (e.g., a persistent sidebar) will provide direct access to the application's core sections: Dashboard, Inventory, AI Assistant, Marketplace Integrations, and Settings.

**Secondary Navigation**: Within complex sections like "Settings," a secondary navigation (e.g., tabs) will be used to switch between subsections like "Account," "Display," and "AI Controls."

**Breadcrumb Strategy**: Breadcrumbs will be used on deeply nested pages (like the Item Detail / Editor) to provide clear context and easy one-click navigation back to parent pages (e.g., Home > Inventory > Item Name).
