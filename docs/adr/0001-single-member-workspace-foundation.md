# 0001. Single-Member Workspace Foundation for v1

## Context
A full multi-tenant support application typically requires team invites, role-based access control (RBAC), seat management, and member removal. For v1, building full team management machinery adds substantial scope without validating the core live chat and AI support loop. However, building a flat user account without an organization entity would require an expensive schema refactor when multi-user support is added in v2.

## Decision
We will model multi-tenant organizations in the database schema from day one using an `Organization`/`Workspace` model (via Better-Auth organization plugin). For v1, each Business Owner who signs up automatically creates a single Workspace and is added as its sole member. Invitation endpoints, role permission matrices, and seat management UI are explicitly deferred to v2.

## Consequences
- The database schema is future-proof for v2 team expansion with zero migrations required to support multiple operators per workspace.
- v1 user experience remains lean: signup $\rightarrow$ workspace created $\rightarrow$ embed widget $\rightarrow$ upload knowledge.
- In v1, the terms "Business Owner" and "Operator" refer to the same individual.
