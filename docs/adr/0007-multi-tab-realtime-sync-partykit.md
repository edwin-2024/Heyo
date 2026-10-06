# 0007. Visitor Multi-Tab Real-Time Sync via PartyKit

## Context
Website visitors frequently browse with multiple browser tabs open simultaneously (e.g., checkout page, product page, docs). If the chat widget state is isolated per tab, typing in one tab produces a desynchronized or conflicting conversation in the other.

## Decision
We leverage PartyKit's room architecture where every tab belonging to the same Visitor (sharing the same `visitor_token` in `localStorage`) connects to the identical PartyKit room (`room_<workspace_id>_<conversation_id>`). All inbound and outbound events (visitor messages, operator messages, streaming AI tokens, typing indicators) broadcast across all connected tabs in real time.

## Consequences
- Frictionless visitor experience: closing or switching tabs never loses state or pending messages.
- No polling or manual `BroadcastChannel` coordination required on the client; PartyKit edge WebSockets handle multi-tab synchronization naturally.
