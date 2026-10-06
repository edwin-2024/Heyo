# 0003. Dual-Guardrail RAG Pipeline and Handoff State Machine

## Context
Naive support bots suffer from two critical failure modes:
1. Responding to off-topic prompts, homework, or jailbreaks, causing token exhaustion and liability.
2. Hallucinating when knowledge documentation does not contain the answer, or trapping frustrated users in endless loops without a human option.

## Decision
We enforce a dual-guardrail architecture:
1. **Pre-Retrieval Intent Classifier Gate (Step 3)**: Evaluates incoming messages using the last 3 conversation turns. Greets users cordially on pleasantries, immediately declines off-topic prompts with a polite boundary message, and routes only genuine product/support queries to RAG.
2. **Dual-Guardrail Retrieval Threshold & Handoff (Step 5 & 6)**:
   - If vector similarity across retrieved chunks is below $0.65$, skip generation and transition immediately to `WAITING_HUMAN`.
   - If retrieved chunks are passed to the model but lack sufficient facts to answer, the model is instructed to emit `[HANDOFF_REQUIRED]` rather than fabricating details.
3. **Visitor-Initiated Escalation**: A permanent "Talk to a human" button is provided in the widget UI alongside NLP detection.

## Consequences
- Token burn is minimized by halting off-topic queries before expensive vector retrieval or LLM generation.
- Zero-tolerance policy on hallucinations: when docs are insufficient, human operators take over.
- State transitions are strictly governed: `AI_ANSWERING` $\rightarrow$ `WAITING_HUMAN` $\rightarrow$ `HUMAN_ACTIVE` $\rightarrow$ `CLOSED`.
