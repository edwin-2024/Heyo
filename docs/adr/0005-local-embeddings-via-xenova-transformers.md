# 0005. Free Local Embeddings via Xenova Transformers

## Context
While OpenAI provides `text-embedding-3-small`, it requires a paid OpenAI account and API key. To minimize operational friction, avoid multi-vendor API dependencies, and enable 100% free vectorization alongside the Groq free tier, we evaluated running in-process embeddings.

## Decision
We chose **`@xenova/transformers`** running the ONNX-optimized **`bge-small-en-v1.5`** model (384 dimensions) directly in Node.js / serverless workers.
The Postgres `document_chunks` table will define its vector column as `embedding vector(384)`.

## Consequences
- **Zero Cost**: Embeddings generation incurs $0 and requires no OpenAI API key.
- **Privacy & Self-Containment**: Document chunks are vectorized locally without sending raw text to third-party embedding APIs.
- **Neon pgvector Optimization**: 384-dimensional vectors use ~75% less storage and memory in Postgres compared to 1536-dimensional vectors, resulting in faster HNSW index scans.
- Ingestion workers require the `@xenova/transformers` runtime dependency.
