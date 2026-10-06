# 0004. Groq for Fast LLM Inference and Embeddings Strategy

## Context
The user requested using **Groq API key** for chatbot and classifier inference. We needed to clarify whether Groq provides embeddings and determine the most cost-effective, high-performance strategy for both text generation and vector embeddings.

## Considered Options
1. **OpenAI for Everything**: OpenAI `gpt-4o-mini` for inference, `text-embedding-3-small` for embeddings. (Incurs token costs on both).
2. **Groq for Inference + Dedicated Embeddings Provider**:
   - **LLM Inference**: Groq LPU engine running `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`. Offers sub-second time-to-first-token streaming, ideal for live chat widgets, with a generous free tier.
   - **Embeddings**: Groq does not offer an embeddings API endpoint. For embeddings, we evaluate:
     - *Option 2A (OpenAI Embeddings)*: Ultra-cheap ($0.02 per 1M tokens), industry standard, highly reliable.
     - *Option 2B (Local / Free Open-Source Embeddings)*: Running `@xenova/transformers` (`bge-small-en-v1.5`) in-process or a free tier provider (e.g. HuggingFace / Voyage).

## Decision
- **Inference & Classifier**: Standardize on **Groq** (`llama-3.3-70b-versatile` for synthesis, `llama-3.1-8b-instant` for ultra-fast Step 3 classification).
- **Embeddings**: Use **OpenAI `text-embedding-3-small`** (or offer local/free fallback via `@xenova/transformers`). Note that OpenAI embeddings are not completely free, but practically negligible in cost ($0.02 / 1M tokens = tens of thousands of pages per dollar).

## Consequences
- Live chat widget gains near-instantaneous streaming speed via Groq LPUs.
- Clear separation between the generation model (Groq) and the vectorizer (OpenAI / local embedding model).
