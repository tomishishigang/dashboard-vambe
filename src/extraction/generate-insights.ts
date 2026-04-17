import "dotenv/config";
import { writeFileSync } from "fs";
import OpenAI from "openai";
import { z } from "zod/v4";
import { DB_PATH, INSIGHTS_PATH } from "../config/paths";
import { LeadRepository } from "../db/client";
import { buildDashboardData, calculateCloseRate } from "../lib/analytics";
import { resolveProviderConfig } from "./providers/config";

function buildAnalysisSummary(repo: LeadRepository) {
  const leads = repo.getAll();
  const data = buildDashboardData(leads);

  // Build cross-tabulation: vendor x industry
  const vendorIndustry: Record<string, Record<string, { total: number; closed: number }>> = {};
  for (const lead of leads) {
    if (!vendorIndustry[lead.vendedor]) vendorIndustry[lead.vendedor] = {};
    if (!vendorIndustry[lead.vendedor][lead.industria]) vendorIndustry[lead.vendedor][lead.industria] = { total: 0, closed: 0 };
    vendorIndustry[lead.vendedor][lead.industria].total++;
    if (lead.closed) vendorIndustry[lead.vendedor][lead.industria].closed++;
  }

  // Build cross-tabulation: vendor x concern
  const vendorConcern: Record<string, Record<string, { total: number; closed: number }>> = {};
  for (const lead of leads) {
    if (!vendorConcern[lead.vendedor]) vendorConcern[lead.vendedor] = {};
    if (!vendorConcern[lead.vendedor][lead.preocupacion_principal]) vendorConcern[lead.vendedor][lead.preocupacion_principal] = { total: 0, closed: 0 };
    vendorConcern[lead.vendedor][lead.preocupacion_principal].total++;
    if (lead.closed) vendorConcern[lead.vendedor][lead.preocupacion_principal].closed++;
  }

  return `
## Datos Agregados del Pipeline de Ventas de Vambe

### Resumen General
- Total leads: ${data.summary.totalLeads}
- Deals cerrados: ${data.summary.totalClosed} (${data.summary.overallCloseRate}% close rate)
- Volumen promedio mensual: ${data.summary.avgVolume} interacciones/mes (${data.summary.leadsWithVolume} leads reportaron)

### Close Rate por Industria
${data.byIndustria.map(d => `- ${d.label}: ${d.closeRate}% (${d.closed}/${d.total})`).join("\n")}

### Close Rate por Vendedor
${data.byVendedor.map(d => `- ${d.label}: ${d.closeRate}% (${d.closed}/${d.total})`).join("\n")}

### Close Rate por Canal de Descubrimiento
${data.byCanal.map(d => `- ${d.label}: ${d.closeRate}% (${d.closed}/${d.total})`).join("\n")}

### Close Rate por Requerimiento Clave del Cliente
${data.byPreocupacion.map(d => `- ${d.label}: ${d.closeRate}% (${d.closed}/${d.total})`).join("\n")}

### Close Rate por Tamaño de Empresa
${data.byTamano.map(d => `- ${d.label}: ${d.closeRate}% (${d.closed}/${d.total})`).join("\n")}

### Cruce Vendedor x Industria (close rate)
${Object.entries(vendorIndustry).map(([vendor, industries]) =>
  `**${vendor}**: ${Object.entries(industries).map(([ind, v]) => `${ind} ${calculateCloseRate(v.closed, v.total)}% (${v.closed}/${v.total})`).join(", ")}`
).join("\n")}

### Cruce Vendedor x Requerimiento Clave (close rate)
${Object.entries(vendorConcern).map(([vendor, concerns]) =>
  `**${vendor}**: ${Object.entries(concerns).map(([c, v]) => `${c} ${calculateCloseRate(v.closed, v.total)}% (${v.closed}/${v.total})`).join(", ")}`
).join("\n")}
`.trim();
}

const INSIGHTS_PROMPT = `Eres un consultor senior de ventas B2B SaaS. Analizas datos de un pipeline de ventas y generas recomendaciones accionables.

Se te entregan datos agregados del pipeline de Vambe (plataforma de automatización de conversaciones con IA). Tu tarea es generar EXACTAMENTE 5 conclusiones estratégicas.

Reglas:
- Cada conclusión debe ser ESPECÍFICA con números concretos de la data
- Cada conclusión debe decir QUÉ HACER, no solo describir lo que pasó
- Usa un tono directo y ejecutivo — esto lo lee un Head of Sales
- No repitas la misma conclusión de dos formas distintas
- Prioriza insights accionables sobre observaciones genéricas
- Las conclusiones deben cubrir temas distintos: asignación de vendedores, canales, industrias, requerimientos, oportunidades perdidas

Responde ÚNICAMENTE con un JSON válido (sin markdown) con esta estructura:
{
  "insights": [
    {
      "titulo": "Título corto y directo (max 8 palabras)",
      "descripcion": "Conclusión detallada con números y recomendación clara de qué hacer. 2-3 oraciones máximo.",
      "categoria": "asignacion" | "canal" | "industria" | "requerimiento" | "oportunidad"
    }
  ]
}`;

// Zod schema for LLM response validation
const InsightSchema = z.object({
  titulo: z.string(),
  descripcion: z.string(),
  categoria: z.string(),
});

const InsightsResponseSchema = z.object({
  insights: z.array(InsightSchema).min(1),
});

function createLLMClient(config: ReturnType<typeof resolveProviderConfig>) {
  const baseURLs: Record<string, string> = {
    openrouter: "https://openrouter.ai/api/v1",
  };
  const defaultModels: Record<string, string> = {
    openrouter: "google/gemma-4-31b-it:free",
    openai: "gpt-4o-mini",
    gemini: "gemini-2.5-flash",
  };

  return {
    client: new OpenAI({
      apiKey: config.apiKey,
      baseURL: baseURLs[config.provider],
    }),
    model: config.model ?? defaultModels[config.provider] ?? "gpt-4o-mini",
  };
}

async function main() {
  console.log("📊 Building analysis summary...");
  const repo = new LeadRepository(DB_PATH);
  const summary = buildAnalysisSummary(repo);
  repo.close();

  console.log("🤖 Generating AI insights...");
  const config = resolveProviderConfig();
  const { client, model } = createLLMClient(config);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: INSIGHTS_PROMPT },
      { role: "user", content: summary },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("LLM returned empty response");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`LLM returned invalid JSON: ${text.slice(0, 200)}`);
  }

  const { insights } = InsightsResponseSchema.parse(raw);

  console.log(`✅ Generated ${insights.length} insights:`);
  insights.forEach((ins, i) => {
    console.log(`   ${i + 1}. [${ins.categoria}] ${ins.titulo}`);
  });

  writeFileSync(
    INSIGHTS_PATH,
    JSON.stringify({ insights, generatedAt: new Date().toISOString(), model, provider: config.provider }, null, 2),
  );
  console.log(`💾 Saved to ${INSIGHTS_PATH}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
