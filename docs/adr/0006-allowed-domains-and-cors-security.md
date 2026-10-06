# 0006. Configured Allowed Domains and CORS Security

## Context
Anyone who inspects a customer's website could potentially copy their Heyo widget embed tag (`data-workspace-id`) and paste it onto an unauthorized third-party site, draining the Business Owner's AI resources and impersonating support.

## Decision
Each Workspace requires an **Allowed Domains** configuration list (e.g. `example.com`, `app.example.com`, and `localhost` during development).
Next.js API route handlers inspect the `Origin` / `Referer` headers on incoming widget requests, and the widget iframe `Content-Security-Policy` restricts frame embedding strictly to the verified domains.

## Consequences
- Prevents cross-site widget theft and unauthorized AI generation abuse.
- Development requires explicit inclusion of local dev origins (e.g., `localhost:3000`).
