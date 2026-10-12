interface CloudflareAIEmbeddingResponse {
  result?: {
    data?: number[][];
    shape?: number[];
  };
  success?: boolean;
  errors?: Array<{ code?: number; message?: string }>;
  messages?: string[];
}

let localExtractorPromise: Promise<any> | null = null;

async function getLocalExtractor() {
  if (!localExtractorPromise) {
    const { pipeline } = await import("@xenova/transformers");
    localExtractorPromise = pipeline("feature-extraction", "Xenova/bge-small-en-v1.5");
  }
  return localExtractorPromise;
}

/**
 * Generates 384-dimensional normalized vector embeddings using the local ONNX
 * bge-small-en-v1.5 model (ADR-0005).
 */
async function generateLocalEmbeddings(texts: string[]): Promise<number[][]> {
  const extractor = await getLocalExtractor();
  const results: number[][] = [];
  for (const text of texts) {
    const output = await extractor(text, { pooling: "mean", normalize: true });
    results.push(Array.from(output.data));
  }
  return results;
}

/**
 * Generates 384-dimensional vector embeddings using Cloudflare Workers AI
 * (@cf/baai/bge-small-en-v1.5). Batches requests in groups of up to 16.
 * Falls back to local @xenova/transformers bge-small-en-v1.5 if Cloudflare token expires or fails.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) {
    return [];
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();

  // If Cloudflare credentials are provided, attempt Cloudflare Workers AI first
  if (accountId && token) {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/baai/bge-small-en-v1.5`;
      const BATCH_SIZE = 16;
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: batch }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Cloudflare Workers AI error (${response.status}): ${errorText}`
          );
        }

        const data = (await response.json()) as CloudflareAIEmbeddingResponse;
        if (!data.success || !data.result?.data) {
          throw new Error(
            `Cloudflare Workers AI returned invalid response: ${JSON.stringify(data)}`
          );
        }

        allEmbeddings.push(...data.result.data);
      }

      return allEmbeddings;
    } catch (cfError) {
      console.warn(
        "[Embeddings] Cloudflare Workers AI request failed, falling back to local bge-small-en-v1.5 (ADR-0005):",
        (cfError as Error).message
      );
    }
  }

  // Seamless fallback to in-process Xenova bge-small-en-v1.5 (ADR-0005)
  return generateLocalEmbeddings(texts);
}

