import type { ExtraccionLead } from "../schema";

export interface LLMProvider {
  readonly providerName: string;
  readonly modelName: string;

  /**
   * Extract structured lead data from a transcript.
   * The provider must return data conforming to ExtraccionLeadSchema.
   */
  extract(transcript: string, systemPrompt: string): Promise<ExtraccionLead>;
}

export interface ProviderConfig {
  provider: "openai" | "gemini" | "openrouter";
  apiKey: string;
  model?: string;
}
