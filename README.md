# Vambe Lead Intelligence Dashboard

Dashboard interactivo que procesa transcripciones de reuniones de ventas, las categoriza automáticamente con IA, y muestra métricas accionables para un equipo comercial.

**Live:** [dashboard-vambe.vercel.app](https://dashboard-vambe.vercel.app)

---

## Decisiones Clave

### 1. Pivot de "Sales Coaching" a "Lead Intelligence"

Al analizar las transcripciones, se identificó que **no son diálogos reales** entre vendedor y cliente — son monólogos sintéticos del cliente describiendo su empresa y necesidades. No contienen objeciones, manejo de objeciones, ni interacción del vendedor.

En lugar de simular extracciones que la data no soporta (sentiment analysis, coaching, objection playbook), se pivotó hacia **Lead Intelligence**: usar el LLM para enriquecer el perfil del lead y descubrir señales del ICP (Ideal Customer Profile) correlacionadas con cierre de ventas.

Esto es más honesto con la data y más valioso comercialmente: un Head of Sales puede accionar sobre "qué tipo de lead cierra" en vez de "cómo mejorar la conversación".

### 2. Categorías extraídas (10 dimensiones)

Las dimensiones fueron seleccionadas iterativamente:
1. Lectura manual de ~15 transcripciones para identificar patrones
2. Primera extracción con schema amplio (v1.0 — 16 industrias + "otro", 8 preocupaciones)
3. Análisis de distribución: se detectó que "otro" capturaba 13% de leads, varias categorías tenían n=1, y preocupaciones similares estaban fragmentadas
4. Consolidación (v2.0): se eliminaron categorías muertas, se fusionaron preocupaciones solapadas (`mantener_toque_humano` + `personalizacion_tono` → `personalizacion`), y se agregó `servicios_profesionales` para absorber consultorías

**Dimensiones finales:**

| Dimensión | Tipo | Valores |
|---|---|---|
| Industria | enum (14) | servicios_profesionales, retail_ecommerce, tecnologia, ... |
| Tamaño empresa | enum (3) | startup, pyme, mediana |
| Caso de uso primario | enum (6) | soporte_tecnico, atencion_general, reservas_citas, ... |
| Canal de descubrimiento | enum (7) | conferencia_feria, referido_colega, contenido_digital, ... |
| Estacionalidad | enum (3) | constante, picos_moderados, muy_estacional |
| Integraciones requeridas | array enum | crm, ecommerce, sistema_citas, ... |
| Sector regulado | boolean | true si salud, legal o financiero |
| Requerimiento clave | enum (5) | personalizacion, calidad_precision, escalabilidad, ... |
| Madurez digital | enum (2) | alta, media |
| Volumen mensual estimado | number | Normalizado a interacciones/mes. 0 = no informado |

### 3. ¿Por qué JSON y no una base de datos?

Con **60 filas y ~90KB de data estática**, una base de datos es overhead injustificado:
- No hay escrituras en runtime (el dashboard solo lee)
- No hay queries SQL complejos (toda la agregación es TypeScript)
- No hay concurrencia
- `better-sqlite3` requiere binarios nativos → complica el deploy

Un archivo JSON ofrece lo mismo sin dependencias nativas, con deploy trivial en cualquier plataforma.

**Para escalar a 10k+ leads**: se migraría a SQLite con FTS5 (para full-text search) o un servicio como Meilisearch/Algolia. El `LeadRepository` mantiene la misma interfaz — el cambio es transparente.

### 4. Provider-agnostic: por qué y cómo

El pipeline de extracción soporta **3 proveedores de LLM** (OpenAI, Gemini, OpenRouter) con una interfaz común:

```
LLMProvider.extract(transcript, systemPrompt) → ExtraccionLead
```

Cada provider adapta la llamada a su API:
- **OpenAI**: structured outputs nativos via `zodResponseFormat`
- **Gemini**: JSON schema OpenAPI 3.0 + validación Zod
- **OpenRouter**: JSON mode + schema embebido en prompt + validación Zod

Se selecciona automáticamente según las variables de entorno. Agregar un nuevo provider (Anthropic, Groq, etc.) es crear un archivo y registrarlo en el factory.

### 5. Búsqueda client-side

Para N=60, `Array.filter()` con `String.includes()` sobre los campos relevantes es instantáneo. No se justifica un motor de búsqueda. La búsqueda filtra sobre: nombre, correo, vendedor, industria, canal, requerimiento clave, transcripción y evidencia.

### 6. Conclusiones generadas con IA

Además de la extracción de categorías, el LLM se usa una segunda vez para **analizar los datos agregados** y generar conclusiones estratégicas. Las recomendaciones se pre-generan con `pnpm insights` y se almacenan en `data/insights.json` — el dashboard las renderiza sin llamar al LLM en runtime.

Esto demuestra un uso doble del LLM: (1) extracción estructurada de datos, (2) análisis y recomendaciones de negocio.

---

## Arquitectura

```
src/
├── config/paths.ts              ← Constantes centralizadas
├── db/client.ts                 ← LeadRepository (JSON read/write)
├── extraction/                  ← Pipeline ETL (independiente del frontend)
│   ├── schema.ts                ← Zod schemas (fuente de verdad)
│   ├── prompt.ts                ← System prompt versionado (v2.0)
│   ├── csv-parser.ts            ← CSV → RawLead[]
│   ├── extract.ts               ← Lógica agnóstica + retry con backoff
│   ├── generate-insights.ts     ← Generación de conclusiones IA
│   ├── providers/               ← Factory pattern: OpenAI, Gemini, OpenRouter
│   │   ├── types.ts             ← LLMProvider interface
│   │   ├── config.ts            ← Resolución de provider desde .env
│   │   ├── openai.ts            ← Structured outputs
│   │   ├── gemini.ts            ← JSON schema + Zod
│   │   ├── openrouter.ts        ← JSON mode + schema en prompt
│   │   └── index.ts             ← Factory
│   └── run.ts                   ← CLI orchestrator
├── lib/
│   ├── analytics.ts             ← Business logic (aggregation, metrics)
│   └── lead-service.ts          ← Service layer (data access + analytics)
├── hooks/
│   └── use-dashboard-filter.ts  ← Estado de filtros + búsqueda
├── components/
│   ├── dashboard.tsx            ← Orchestrator de UI
│   ├── ai-insights.tsx          ← Conclusiones generadas con IA
│   ├── charts/                  ← Visualizaciones reutilizables
│   │   ├── close-rate-bar.tsx   ← Bar charts con click-to-filter
│   │   ├── heatmap.tsx          ← Heatmap genérico
│   │   ├── opportunity-bubble.tsx ← Bubble chart de cuadrantes
│   │   ├── timeline-chart.tsx   ← Area chart temporal
│   │   ├── kpi-cards.tsx        ← Tarjetas de KPI
│   │   └── insight-card.tsx     ← Insight individual
│   ├── leads-table.tsx          ← Tabla con sort por columnas
│   ├── lead-detail.tsx          ← Drill-down de lead
│   └── status-badge.tsx         ← Componente compartido
└── app/                         ← Next.js App Router
    ├── page.tsx                 ← Server component (data loading)
    └── api/leads/route.ts       ← API endpoint
```

**Separación de capas:**
- **Config** → **Service** → **Analytics** → **Components**: dependency direction unidireccional
- ETL pipeline completamente independiente del frontend
- Zod schema como contrato único: valida la salida del LLM, tipifica TypeScript, y define la estructura de storage

---

## Stack Técnico

| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 16.2 | Framework (App Router, SSR) |
| React | 19.2 | UI |
| TypeScript | 5.9 | Type safety end-to-end |
| Zod | 4.3 | Validación de schemas + structured outputs |
| Recharts | 3.8 | Visualizaciones |
| shadcn/ui | - | Component library |
| Tailwind CSS | 4.2 | Styling |
| OpenAI / Gemini / OpenRouter SDK | - | LLM providers |
| Vercel | - | Deploy |

---

## Ejecución Local

### Requisitos
- Node.js 20+
- pnpm

### Setup

```bash
# 1. Clonar e instalar
git clone https://github.com/tomishishigang/dashboard-vambe.git
cd dashboard-vambe
pnpm install

# 2. Ejecutar (la data ya está pre-procesada en data/leads.json)
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Re-procesar las transcripciones (opcional)

Para re-ejecutar la extracción con LLM:

```bash
# Crear .env con una API key (elegir UNO):
cp .env.example .env
# Editar .env con la key correspondiente

# Ejecutar extracción
pnpm extract          # Procesa las 60 transcripciones
pnpm extract:sample   # Procesa solo las primeras 3 (para testing)

# Generar conclusiones IA (requiere API key)
pnpm insights
```

---

## Métricas del Dashboard

### KPIs
- Total leads, industrias cubiertas, close rate general, interacciones promedio mensual

### Visualizaciones
- **Bar charts interactivos** (6 tabs): close rate por industria, vendedor, canal, requerimiento clave, tamaño, caso de uso — click en barras para filtrar todo el dashboard
- **Mapa de oportunidad**: bubble chart con cuadrantes (Estrella / Oportunidad / Nicho / Bajo potencial)
- **Heatmaps**: Vendedor x Industria, Vendedor x Requerimiento Clave, Vendedor x Mes (cronológico)
- **Timeline**: leads y cierres por mes (se filtra junto con el resto del dashboard)
- **Conclusiones IA**: 5 recomendaciones estratégicas generadas automáticamente
- **Tabla de leads**: columnas ordenables, búsqueda de texto, click para drill-down
- **Lead detail**: ficha completa con las 10 dimensiones + evidencia textual del LLM

### Interactividad
- Click en cualquier barra → filtra todo el dashboard por esa dimensión
- Búsqueda de texto libre → filtra charts, heatmaps, timeline y tabla en tiempo real
- Columnas de tabla ordenables (click en header para sort asc/desc)
- Click en un lead → muestra ficha detallada con cita textual de la transcripción

---

## Limitaciones y Next Steps

### Limitaciones de la data
- **N=60**: cualquier cruce con celdas < 5 debe interpretarse como señal, no conclusión
- **63% sin volumen**: las transcripciones no siempre incluyen números concretos. El dashboard marca "Sin dato" en vez de 0
- **Tamaño empresa**: 85% clasificado como "pyme" — la dimensión discrimina poco con esta data

### Mejoras futuras
- **Signal Strength table**: feature importance — qué dimensiones correlacionan más con cierre
- **Vendor Playbook**: recomendaciones per-vendedor basadas en fortalezas/debilidades por vertical
- **Tests**: golden set de 5 transcripciones con extracciones esperadas para validar el prompt
- **Error boundary**: página de error si la data no existe o está corrupta
- **Mobile responsive**: pase completo de responsive para charts
