# Vambe Lead Intelligence Dashboard

Dashboard interactivo que procesa transcripciones de reuniones de ventas, las categoriza con IA y muestra métricas accionables para un equipo comercial.

**Live:** [dashboard-vambe.vercel.app](https://dashboard-vambe.vercel.app)

---

## Decisiones Clave

### 1. Pivot de "Sales Coaching" a "Lead Intelligence"

Al analizar las transcripciones, se identificó que no son diálogos reales entre vendedor y cliente — son monólogos del cliente describiendo su empresa y necesidades. No contienen objeciones, manejo de objeciones, ni interacción del vendedor.

En lugar de forzar extracciones que la data no soporta (sentiment analysis, coaching, objection playbook), se pivotó hacia Lead Intelligence: usar el LLM para enriquecer el perfil del lead y descubrir señales del ICP (Ideal Customer Profile) correlacionadas con cierre de ventas.

Para un Head of Sales esto es más útil: puede accionar sobre "qué tipo de lead cierra" en vez de "cómo mejorar la conversación".

### 2. Categorías extraídas (10 dimensiones)

Las dimensiones fueron seleccionadas iterativamente:
1. Lectura manual de ~15 transcripciones para identificar patrones recurrentes
2. Primera extracción con schema amplio (v1.0 — 16 industrias + "otro", 8 preocupaciones)
3. Análisis de distribución: "otro" capturaba 13% de leads, varias categorías tenían n=1, preocupaciones similares estaban fragmentadas
4. Consolidación (v2.0): se eliminaron categorías muertas, se fusionaron preocupaciones solapadas (`mantener_toque_humano` + `personalizacion_tono` → `personalizacion`), y se agregó `servicios_profesionales` para absorber consultorías

**¿Por qué estas 10 y no otras?** El criterio fue: cada dimensión debe responder una pregunta que un Head of Sales haría al evaluar su pipeline. "¿Qué vertical cierra más?" → industria. "¿Qué canal trae leads que convierten?" → canal de descubrimiento. "¿A qué tamaño de empresa le vendemos mejor?" → tamaño empresa. Dimensiones que no responden una pregunta accionable no se incluyeron.

**Dimensiones con gráfico propio (7):** tienen distribución suficiente para sacar conclusiones visuales con N=60.

| Dimensión | Tipo | Para qué sirve |
|---|---|---|
| Industria | enum (14) | Verticales rentables vs no rentables. Redirigir marketing y asignar vendedores por vertical. |
| Caso de uso primario | enum (6) | Qué problema quieren resolver con Vambe (soporte, reservas, cotizaciones). Product-market fit. |
| Canal de descubrimiento | enum (7) | Atribución de marketing: qué canales traen leads que cierran. |
| Requerimiento clave | enum (5) | Qué le importa más al cliente al evaluar Vambe. Adaptar el pitch. |
| Estacionalidad | enum (3) | Constantes cierran 76% vs estacionales 50% — señal accionable con distribución 38/18/4. |
| Volumen mensual estimado | number | Tamaño de la oportunidad en interacciones/mes. 63% no reporta número — se marca "Sin dato". |
| Tamaño empresa | enum (3) | Segmentación de ICP. 85% pyme (baja varianza), pero la categoría es relevante a mayor escala. |

**Dimensiones sin gráfico — solo en detalle del lead (3):**

| Dimensión | Tipo | Por qué no tiene gráfico |
|---|---|---|
| Madurez digital | enum (2) | Solo 2 valores (alta/media) con distribución 85/15. Con N=9 en "alta" y 9pp de diferencia en close rate (78% vs 69%), el gráfico no aporta información confiable. Se mantiene en el perfil del lead porque con un dataset mayor (N>200) y mayor varianza la dimensión sí discriminaría. |
| Sector regulado | boolean | Derivado de industria (salud/legal/financiero → regulado). Graficarlo duplica información que ya está en el chart de industria. Útil como dato de contexto en la ficha individual. |
| Integraciones requeridas | array enum | Un lead puede requerir múltiples integraciones (CRM + tickets + e-commerce). Al ser un array, no se mapea a un bar chart de close rate donde cada lead cuenta una sola vez. Con más datos podría tener un chart de frecuencia. |

Las 3 dimensiones sin gráfico se siguen extrayendo con el LLM y se almacenan en cada lead. No se eliminan del schema porque: (1) el costo de extracción es marginal (van en el mismo prompt), (2) enriquecen el perfil individual del lead, y (3) con un dataset más grande justificarían visualizaciones propias.

### 3. ¿Por qué JSON y no una base de datos?

60 filas y ~90KB de data estática. No hay escrituras en runtime, no hay queries complejos, no hay concurrencia. Un archivo JSON resuelve todo sin dependencias nativas y con deploy trivial.

Para escalar a 10k+ leads se migraría a SQLite con FTS5 o un servicio como Meilisearch/Algolia. El `LeadRepository` mantiene la misma interfaz — el cambio es transparente.

### 4. Provider-agnostic: por qué y cómo

El pipeline de extracción soporta 3 proveedores de LLM (OpenAI, Gemini, OpenRouter) con una interfaz común:

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

Además de la extracción de categorías, el LLM se usa una segunda vez para analizar los datos agregados y generar conclusiones estratégicas. Las recomendaciones se pre-generan con `pnpm insights` y se almacenan en `data/insights.json` — el dashboard las renderiza sin llamar al LLM en runtime.

Dos usos del LLM: (1) extracción estructurada de datos por lead, (2) análisis y recomendaciones sobre el dataset completo.

---

## Arquitectura

```
src/
├── config/paths.ts              ← Constantes centralizadas
├── db/client.ts                 ← LeadRepository (JSON read/write)
├── cli/                         ← Scripts CLI (orquestan extraction + db + analytics)
│   ├── run.ts                   ← Extracción: CSV → LLM → JSON
│   └── generate-insights.ts     ← Generación de conclusiones IA
├── extraction/                  ← Pipeline ETL (independiente del frontend y del CLI)
│   ├── schema.ts                ← Zod schemas (fuente de verdad)
│   ├── prompt.ts                ← System prompt versionado (v2.0)
│   ├── csv-parser.ts            ← CSV → RawLead[]
│   ├── extract.ts               ← Lógica agnóstica + retry con backoff
│   └── providers/               ← Factory pattern: OpenAI, Gemini, OpenRouter
│       ├── types.ts             ← LLMProvider interface
│       ├── config.ts            ← Resolución de provider desde .env
│       ├── openai.ts            ← Structured outputs
│       ├── gemini.ts            ← JSON schema + Zod
│       ├── openrouter.ts        ← JSON mode + schema en prompt
│       └── index.ts             ← Factory
├── lib/
│   ├── analytics.ts             ← Business logic (aggregation, metrics)
│   └── lead-service.ts          ← Service layer (data access + analytics)
├── hooks/
│   └── use-dashboard-filter.ts  ← Estado de filtros + búsqueda
├── components/
│   ├── ui/                      ← Primitivas shadcn/ui
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
- **Config** → **DB** → **Service** → **Analytics** → **Components**: dependency direction unidireccional
- **Extraction** (ETL puro): schema, prompt, providers, lógica de extracción. Sin dependencias del frontend ni de la DB.
- **CLI**: scripts que orquestan extraction + db + analytics. Son entry points, no lógica de negocio.
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
| shadcn/ui | 4.2 | Component library |
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

# 3. Verificar que compila correctamente
pnpm build
```

El servidor de desarrollo corre en [http://localhost:3000](http://localhost:3000).

### Re-procesar las transcripciones (opcional)

La data ya viene procesada en `data/leads.json`, pero si se quiere re-ejecutar la extracción con LLM:

```bash
# 1. Crear .env con una API key
cp .env.example .env
```

Elegir UNO de los 3 providers y descomentar su key en `.env`:
- **OpenRouter** — el más fácil para probar: tiene modelos gratuitos, no requiere tarjeta de crédito. Crear key en [openrouter.ai/keys](https://openrouter.ai/keys).
- **OpenAI** — requiere cuenta con créditos.
- **Gemini** — key gratuita desde [aistudio.google.com](https://aistudio.google.com).

```bash
# 2. Ejecutar extracción
pnpm extract          # Procesa las 60 transcripciones (~2-3 min)
pnpm extract:sample   # Procesa solo las primeras 3 (para testing rápido)

# 3. Generar conclusiones IA (requiere la misma API key)
pnpm insights
```

---

## Métricas del Dashboard

### KPIs
- Total leads, industrias cubiertas, close rate general, interacciones promedio mensual

### Visualizaciones
- **Bar charts interactivos** (7 tabs): close rate por industria, vendedor, canal, requerimiento clave, tamaño, caso de uso, estacionalidad — click en barras para filtrar todo el dashboard
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

### API

El dashboard expone un endpoint REST:

```
GET /api/leads → { leads: LeadRow[], dashboard: DashboardData, aiInsights?: InsightsData }
```

Devuelve los leads, métricas agregadas, y conclusiones IA en un solo payload JSON.

---

## Limitaciones y Next Steps

### Limitaciones de la data
- **N=60**: cualquier cruce con celdas < 5 debe interpretarse como señal, no conclusión. Esto motivó que 3 dimensiones (madurez digital, sector regulado, integraciones) no tengan gráfico propio — ver justificación en la sección de categorías.
- **63% sin volumen**: las transcripciones no siempre incluyen números concretos. El dashboard marca "Sin dato" en vez de 0.
- **Baja varianza en algunas dimensiones**: tamaño empresa (85% pyme) y madurez digital (85% media) discriminan poco con esta muestra. Se mantienen porque a mayor escala serían relevantes.

### Mejoras futuras
- **Signal Strength table**: feature importance — qué dimensiones correlacionan más con cierre
- **Vendor Playbook**: recomendaciones per-vendedor basadas en fortalezas/debilidades por vertical
- **Tests**: golden set de 5 transcripciones con extracciones esperadas para validar el prompt (vitest ya configurado)
- **Error boundary**: página de error si la data no existe o está corrupta
- **Mobile responsive**: pase completo de responsive para charts
