import { GoogleGenAI } from "@google/genai";
import { z } from "zod/v4";
import { ExtraccionLeadSchema, type ExtraccionLead } from "../schema";
import type { LLMProvider } from "./types";

const DEFAULT_MODEL = "gemini-2.5-flash";

// Gemini uses OpenAPI 3.0 schema format, but doesn't support some JSON Schema fields
const UNSUPPORTED_KEYS = ["exclusiveMinimum", "exclusiveMaximum", "$schema"];

function cleanSchemaForGemini(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(cleanSchemaForGemini);
  if (obj !== null && typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (!UNSUPPORTED_KEYS.includes(key)) {
        cleaned[key] = cleanSchemaForGemini(value);
      }
    }
    return cleaned;
  }
  return obj;
}

const responseSchema = cleanSchemaForGemini(
  z.toJSONSchema(ExtraccionLeadSchema, { target: "openapi-3.0" })
);

export function createGeminiProvider(apiKey: string, model?: string): LLMProvider {
  const client = new GoogleGenAI({ apiKey });
  const modelName = model ?? DEFAULT_MODEL;

  return {
    providerName: "gemini",
    modelName,

    async extract(transcript: string, systemPrompt: string): Promise<ExtraccionLead> {
      const response = await client.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\n---\n\nTranscripción a analizar:\n\n${transcript}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.1,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gemini returned empty response");
      }

      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 100)}`);
      }
      return ExtraccionLeadSchema.parse(raw);
    },
  };
}
