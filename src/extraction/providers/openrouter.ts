import OpenAI from "openai";
import { ExtraccionLeadSchema, type ExtraccionLead } from "../schema";
import type { LLMProvider } from "./types";

const DEFAULT_MODEL = "google/gemma-4-31b-it:free";

/**
 * For models without native structured output support, we embed the full
 * JSON schema with exact enum values directly in the user prompt.
 */
const JSON_SCHEMA_INSTRUCTIONS = `
Responde ÚNICAMENTE con un JSON válido (sin markdown, sin texto adicional) con esta estructura exacta:

{
  "industria": string — uno de: "servicios_financieros", "retail_ecommerce", "salud", "tecnologia", "educacion", "logistica_transporte", "turismo_hoteleria", "gastronomia", "legal", "construccion_inmobiliaria", "marketing_publicidad", "produccion_audiovisual", "moda_textil", "servicios_profesionales",
  "tamano_empresa": string — uno de: "startup", "pyme", "mediana",
  "caso_uso_primario": string — uno de: "soporte_tecnico", "atencion_general", "reservas_citas", "consultas_producto", "cotizaciones", "gestion_pedidos_envios",
  "canal_descubrimiento": string — uno de: "conferencia_feria", "webinar_seminario", "referido_colega", "busqueda_online", "contenido_digital", "evento_networking", "foro_comunidad",
  "estacionalidad": string — uno de: "constante", "picos_moderados", "muy_estacional",
  "integraciones_requeridas": array de strings — valores posibles: "crm", "sistema_tickets", "ecommerce", "sistema_citas", "base_datos_propia", "erp", "ninguna_mencionada",
  "sector_regulado": boolean — true si salud, legal o financiero,
  "preocupacion_principal": string — uno de: "personalizacion", "integracion_sistemas", "confidencialidad_compliance", "escalabilidad_volumen", "calidad_precision_respuestas",
  "madurez_digital": string — uno de: "alta", "media",
  "volumen_mensual_estimado": number — entero, normalizado a mensual (diario*30, semanal*4). Si no hay número explícito, devuelve 0,
  "confianza_extraccion": number — entre 0.0 y 1.0,
  "evidencia": string — frase textual de la transcripción que justifica la extracción
}

IMPORTANTE: Usa EXACTAMENTE los valores listados arriba. No inventes variantes.`;

export function createOpenRouterProvider(apiKey: string, model?: string): LLMProvider {
  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const modelName = model ?? DEFAULT_MODEL;

  return {
    providerName: "openrouter",
    modelName,

    async extract(transcript: string, systemPrompt: string): Promise<ExtraccionLead> {
      const completion = await client.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${JSON_SCHEMA_INSTRUCTIONS}\n\n---\n\nTranscripción a analizar:\n\n${transcript}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new Error("OpenRouter returned empty response");
      }

      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        throw new Error(`OpenRouter returned invalid JSON: ${text.slice(0, 100)}`);
      }
      return ExtraccionLeadSchema.parse(raw);
    },
  };
}
