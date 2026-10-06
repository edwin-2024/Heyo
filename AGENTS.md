# AGENTS.md — Heyo Developer & Agent Guide

> **Heyo**: An Intercom-style live customer support platform featuring real-time chat and an autonomous, guardrailed AI support agent.

---

## 1. Context Pointers (Authoritative References)

Before designing, modifying, or debating features, consult the canonical sources of truth:

| Topic | Pointer | When to Read |
| :--- | :--- | :--- |
| **Product Spec & Scopes** | [`PRD.md`](PRD.md) | Reading requirements, milestones, acceptance criteria, or v1 non-goals. |
| **Domain Terminology** | [`GLOSSARY.md`](GLOSSARY.md) | Naming models, functions, variables, or UI labels. Enforces ubiquitous language. |
| **Architectural Decisions** | [`docs/adr/`](docs/adr/) | Reviewing system invariants: tenancy (0001), transport (0002), guardrails (0003), Groq (0004), vectors (0005), domains (0006), multi-tab (0007), alerts (0008), stack (0009). |

---

## 2. Ubiquitous Vocabulary Rules

Strictly conform all code, schemas, and conversations to [`GLOSSARY.md`](GLOSSARY.md):
- Use **Workspace** (never account, project, tenant).
- Use **Business Owner** for the account holder; use **Operator** for the human handling live chats.
- Use **Visitor** for the website end-user (use **Identified Visitor** when authenticated via host SDK).
- Use **Conversation** (never ticket, thread, or chat session).
- Use **Document Chunk** for segmented vector passages.
- Use **Handoff** for the transition from `AI_ANSWERING` to `WAITING_HUMAN`.

---

## 3. Core Architectural Invariants

Every agent touching this codebase must maintain these invariants:

1. **Package Manager**: Use `bun` exclusively (`bun add`, `bun run dev`, `bun run build`). Never invoke `npm`, `pnpm`, or `yarn`.
2. **Server-First Persistence**: Next.js Server Actions / Route Handlers are the single authority for database writes. All messages persist to Neon Postgres *before* broadcasting to PartyKit WebSockets.
3. **Multi-Tab Edge Rooms**: Real-time room IDs follow `room_${workspaceId}_${conversationId}` on PartyKit, synchronizing state across all open browser tabs for a visitor.
4. **Step 3 Intent Classifier Gate**: Every incoming visitor message must pass the Groq LPU classifier (`llama-3.1-8b-instant`) with 3 turns of conversational context. Off-topic queries must be declined before vector retrieval.
5. **Dual-Guardrail Handoff**: Transition to `WAITING_HUMAN` occurs if top chunk cosine similarity is $<0.65$, or if the synthesis model (`llama-3.3-70b-versatile`) outputs `[HANDOFF_REQUIRED]`.
6. **Free-Tier 384d Embeddings**: Vectors are 384 dimensions (`vector(384)`) using Cloudflare Workers AI `bge-small-en-v1.5`. Prisma models declare vectors as `Unsupported("vector(384)")`; similarity search runs via typed `prisma.$queryRaw`.
7. **Single-Member Workspace in v1**: The database schema uses Better-Auth Organization entities from day one, but UI and flows operate in single-member mode until v2.
8. **Iframe Widget Isolation**: The chat widget script (`public/widget.js`) must strictly embed an isolated iframe at `/embed/[workspaceId]` to prevent host-site CSS leakage.

---

## 4. Technology Stack & Project Layout

```
/
├── src/
│   ├── app/                # Next.js App Router (pages, layouts, route handlers)
│   │   ├── api/rpc/        # oRPC fetch route handler (/api/rpc/[...orpc])
│   │   ├── dashboard/      # Operator workspace dashboard
│   │   └── page.tsx        # Public landing page
│   ├── server/             # Server-only logic, oRPC procedures, DB client
│   │   ├── orpc.ts         # Base oRPC builder instance
│   │   └── routers/        # Type-safe API routers (appRouter)
│   └── lib/                # Shared utilities (cn, formatting)
├── party/                  # PartyKit edge WebSocket server code (room logic)
├── docs/adr/               # Numbered Architectural Decision Records (0001-0009)
├── GLOSSARY.md             # Canonical project vocabulary
├── PRD.md                  # Comprehensive product requirements document
└── package.json            # Managed with Bun
```

---

## 5. Engineering & Verification Workflow

1. **Inspect Before Editing**: Trace existing patterns in `src/` and read the relevant ADR before introducing dependencies or schema edits.
2. **Type Safety**: Maintain strict TypeScript with zero `any` assertions. Validate inputs using `zod` and define typed endpoints via `@orpc/server`.
3. **Verification Gate**: Before declaring any feature or bugfix complete, execute `bun run build`. A task is only complete when TypeScript and Turbopack compile with zero errors.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
