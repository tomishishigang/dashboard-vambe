import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ExtraccionLeadSchema, type ExtraccionLead } from "../schema";
import type { LLMProvider } from "./types";

const DEFAULT_MODEL = "gpt-4o-mini";

export function createOpenAIProvider(apiKey: string, model?: string): LLMProvider {
  const client = new OpenAI({ apiKey });
  const modelName = model ?? DEFAULT_MODEL;

  return {
    providerName: "openai",
    modelName,

    async extract(transcript: string, systemPrompt: string): Promise<ExtraccionLead> {
      const completion = await client.chat.completions.parse({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        response_format: zodResponseFormat(ExtraccionLeadSchema, "extraccion"),
        temperature: 0.1,
      });

      const message = completion.choices[0]?.message;
      if (!message?.parsed) {
        throw new Error("OpenAI returned no parsed content");
      }

      return message.parsed;
    },
  };
}
