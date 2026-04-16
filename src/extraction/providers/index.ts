import type { LLMProvider, ProviderConfig } from "./types";
import { createOpenAIProvider } from "./openai";
import { createGeminiProvider } from "./gemini";
import { createOpenRouterProvider } from "./openrouter";

export type { LLMProvider, ProviderConfig };

export function createProvider(config: ProviderConfig): LLMProvider {
  switch (config.provider) {
    case "openai":
      return createOpenAIProvider(config.apiKey, config.model);
    case "gemini":
      return createGeminiProvider(config.apiKey, config.model);
    case "openrouter":
      return createOpenRouterProvider(config.apiKey, config.model);
    default:
      throw new Error(`Unknown provider: ${config.provider}. Supported: openai, gemini, openrouter`);
  }
}
