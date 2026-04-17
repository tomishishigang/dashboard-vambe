import { createHash } from "crypto";
import type { ExtraccionLead, RawLead } from "./schema";
import { SYSTEM_PROMPT, EXTRACTION_PROMPT_VERSION } from "./prompt";
import type { LLMProvider } from "./providers";

export function hashTranscript(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

export interface ExtractionResult {
  raw: RawLead;
  extraction: ExtraccionLead;
  hash: string;
  promptVersion: string;
  model: string;
  provider: string;
}

export async function extractLead(
  provider: LLMProvider,
  lead: RawLead,
): Promise<ExtractionResult> {
  const hash = hashTranscript(lead.transcripcion);

  const extraction = await provider.extract(lead.transcripcion, SYSTEM_PROMPT);

  return {
    raw: lead,
    extraction,
    hash,
    promptVersion: EXTRACTION_PROMPT_VERSION,
    model: provider.modelName,
    provider: provider.providerName,
  };
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; label?: string } = {}
): Promise<T> {
  const maxRetries = opts.maxRetries ?? 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = err != null && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : undefined;
      const isRetryable = status === 429 || status === 503;
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = Math.min(2 ** attempt * 2000, 30000);
      console.warn(`   ⏳ ${opts.label}: ${status} error, retry ${attempt + 1}/${maxRetries} in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}
