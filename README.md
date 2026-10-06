# Heyo

> Real-Time Live customer support platform featuring real-time chat and an autonomous, guardrailed AI support agent.

## Overview
Heyo is an Intercom-style live customer support platform designed for modern businesses. It combines an embeddable website live chat widget with an autonomous, knowledge-grounded AI support agent and real-time operator takeover.

## Stack
- **Framework**: Next.js (App Router, React 19)
- **Styling**: Tailwind CSS v4, Radix UI / shadcn
- **Type-safe API**: oRPC, Zod
- **Realtime**: PartyKit Edge WebSockets
- **Database & Auth**: Neon Serverless Postgres, pgvector, Neon Managed Better Auth
- **AI & RAG**: Groq LPU, Cloudflare Workers AI Embeddings (bge-small-en-v1.5)
- **Package Manager**: Bun
