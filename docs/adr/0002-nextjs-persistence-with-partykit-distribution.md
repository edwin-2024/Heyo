# 0002. Next.js Persistence with PartyKit Real-Time Distribution

## Context
Heyo requires low-latency token streaming and bidirectional messaging between visitors and dashboard operators. We needed to choose where message validation, database persistence, and AI orchestration live relative to the WebSocket connection.

## Considered Options
1. **PartyKit Edge-First**: Widget connects directly to PartyKit WebSockets. PartyKit receives all messages and coordinates persistence with Next.js via asynchronous webhooks or HTTP callbacks.
2. **Next.js Server-First**: Widget sends messages via HTTP to Next.js route handlers. Next.js validates, writes directly to Neon Postgres, orchestrates the AI pipeline, and publishes streaming tokens/events to PartyKit WebSocket rooms for broadcast.

## Decision
We chose Option 2 (Next.js Server-First). Next.js serves as the single authority for database transactions, visitor authentication, rate limiting, and AI inference. PartyKit acts purely as the high-performance edge distribution fabric for live streaming, room presence, and instant broadcast.

## Consequences
- Clean separation of concerns: database operations and secrets (API keys) remain securely contained within Next.js.
- PartyKit code remains stateless and lightweight, minimizing edge synchronization complexity.
- If a WebSocket client momentarily disconnects, message history is always guaranteed to be safely committed in Postgres.
