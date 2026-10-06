# 0009. Technology Stack Specification (Optimal, Free, Scalable)

## Context
Heyo requires a modern, production-grade architecture that is:
1. **100% Free Tier Viable**: Zero required monthly SaaS bills during development and early production.
2. **Highly Scalable**: Serverless edge compute that automatically scales without server maintenance.
3. **Optimized for Developer Velocity**: Type-safe end-to-end with minimal operational overhead.

## Decisions

### 1. Fullstack Application & Hosting
- **Framework**: Next.js 15 (App Router with Server Components & Server Actions).
- **Styling & UI**: Tailwind CSS v4 + Radix UI / shadcn/ui.
- **Deployment**: Vercel (Hobby Free Tier) with automatic Git deployments.
- **Repository Structure**: Unified single-repo layout with an integrated `/party` folder for PartyKit.

### 2. Real-Time Transport
- **Service**: PartyKit deployed to Cloudflare Edge runtime (free tier: 100k daily requests, generous WebSocket connections).
- **Room Topology**: `room_${workspaceId}_${conversationId}` for real-time visitor-operator-AI token streaming and multi-tab synchronization.

### 3. Database, Vector Store & ORM
- **Database**: Neon Serverless PostgreSQL with `pgvector` extension.
- **Connection Strategy**: Neon Pooled Connection String (`-pooler`) over `@neondatabase/serverless` WebSocket driver to prevent serverless connection exhaustion.
- **ORM**: Prisma ORM with `@prisma/adapter-neon`.
- **Vector Column**: Modeled in Prisma schema as `Unsupported("vector(384)")`. Cosine similarity queries executed via type-safe `prisma.$queryRaw`.

### 4. Authentication
- **Engine**: Better-Auth using `@better-auth/prisma-adapter`.
- **Tenancy Model**: Organization plugin enabled from day one, initialized in single-member mode for v1 Business Owners.

### 5. AI Inference & Embeddings (100% Free Tier)
- **Chat & Classifier LLM**: Groq LPU API (Free Tier) running `llama-3.3-70b-versatile` (synthesis) and `llama-3.1-8b-instant` (Step 3 intent classification).
- **Vector Embeddings**: Cloudflare Workers AI / REST endpoint running `bge-small-en-v1.5` (384 dimensions, free tier).
  - *Rationale*: Eliminates Vercel's 50MB bundle size limit and cold-start penalties associated with local in-process ONNX model downloads, while maintaining 100% free vectorization.

### 6. Object Storage (Presigned Uploads)
- **Service**: Cloudflare R2 / Neon Object Storage (S3-compatible, 10GB free tier, zero egress fees worldwide).
- **SDK**: Standard `@aws-sdk/client-s3` with `@aws-sdk/s3-request-presigner` for direct client-to-storage uploads.

### 7. Embeddable Widget Architecture
- **Packaging**: Lightweight Vanilla JS script (`tsup` bundling into `public/widget.js` < 6KB).
- **Isolation**: Injects a sandboxed floating `iframe` pointing to `/embed/[workspaceId]` to guarantee zero host-site CSS pollution.

## Consequences
- Every tier of the stack operates within generous, permanent free quotas.
- Architecture is cloud-native and serverless from Day 1.
- Clear separation between storage, edge transport, fullstack API, and AI inference.
