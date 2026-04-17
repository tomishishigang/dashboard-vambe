import type { ProviderConfig } from "./types";

export function resolveProviderConfig(): ProviderConfig {
  if (process.env.OPENROUTER_API_KEY) {
    return { provider: "openrouter", apiKey: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL };
  }
  if (process.env.OPENAI_API_KEY) {
    return { provider: "openai", apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL };
  }
  if (process.env.GEMINI_API_KEY) {
    return { provider: "gemini", apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL };
  }
  console.error("❌ No API key found. Set OPENROUTER_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in .env");
  process.exit(1);
}
