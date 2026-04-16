# Vambe Lead Intelligence Dashboard

Dashboard interactivo que procesa transcripciones de reuniones de ventas, las categoriza automáticamente con IA, y muestra métricas accionables para un equipo comercial.

**Live:** [dashboard-vambe.vercel.app](https://dashboard-vambe.vercel.app)

---

## Decisiones Clave

### 1. Pivot de "Sales Coaching" a "Lead Intelligence"

Al analizar las transcripciones, identifiqué que **no son diálogos reales** entre vendedor y cliente — son monólogos sintéticos del cliente describiendo su empresa y necesidades. No contienen objeciones, manejo de objeciones, ni interacción del vendedor.

En lugar de simular extracciones que la data no soporta (sentiment analysis, coaching, objection playbook), pivoté hacia **Lead Intelligence**: usar el LLM para enriquecer el perfil del lead y descubrir señales del ICP (Ideal Customer Profile) correlacionadas con cierre de ventas.

Esto es más honesto con la data y más valioso comercialmente: un Head of Sales puede accionar sobre "qué tipo de lead cierra" en vez de "cómo mejorar la conversación".

### 2. Categorías extraídas (10 dimensiones)

Las dimensiones fueron seleccionadas iterativamente. Proceso:
1. Lectura manual de ~15 transcripciones para identificar patrones
2. Primera extracción con schema amplio (v1.0 — 16 industrias + "otro", 8 preocupaciones)
3. Análisis de distribución: detecté que "otro" capturaba 13% de leads, varias categorías tenían n=1, y preocupaciones similares estaban fragmentadas
4. Consolidación (v2.0): eliminé categorías muertas, fusioné preocupaciones solapadas (`mantener_toque_humano` + `personalizacion_tono` → `personalizacion`), agregué `servicios_profesionales` para absorber consultorías

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
| Preocupación principal | enum (5) | personalizacion, calidad_precision, escalabilidad, ... |
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

Para N=60, `Array.filter()` con `String.includes()` sobre los campos relevantes es instantáneo. No se justifica un motor de búsqueda. La búsqueda filtra sobre: nombre, correo, vendedor, industria, canal, preocupación, transcripción y evidencia.

---

## Arquitectura

```
src/
├── config/paths.ts            ← Constantes centralizadas
├── db/client.ts               ← LeadRepository (JSON read/write)
├── extraction/                ← Pipeline ETL (independiente del frontend)
│   ├── schema.ts              ← Zod schemas (fuente de verdad)
│   ├── prompt.ts              ← System prompt versionado (v2.0)
│   ├── csv-parser.ts          ← CSV → RawLead[]
│   ├── extract.ts             ← Lógica agnóstica + retry con backoff
│   ├── providers/             ← Factory pattern: OpenAI, Gemini, OpenRouter
│   └── run.ts                 ← CLI orchestrator
├── lib/
│   ├── analytics.ts           ← Business logic (aggregation, metrics)
│   └── lead-service.ts        ← Service layer (data access + analytics)
├── hooks/
│   └── use-dashboard-filter.ts ← Estado de filtros + búsqueda
├── components/
│   ├── dashboard.tsx           ← Orchestrator de UI
│   ├── charts/                 ← Visualizaciones reutilizables
│   ├── leads-table.tsx         ← Tabla interactiva
│   ├── lead-detail.tsx         ← Drill-down de lead
│   └── status-badge.tsx        ← Componente compartido
└── app/                        ← Next.js App Router
    ├── page.tsx                ← Server component (data loading)
    └── api/leads/route.ts      ← API endpoint
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

Si querés re-ejecutar la extracción con LLM:

```bash
# Crear .env con tu API key (elegir UNO):
cp .env.example .env
# Editar .env con tu key

# Ejecutar extracción
pnpm extract          # Procesa las 60 transcripciones
pnpm extract:sample   # Procesa solo las primeras 3 (para testing)
```

---

## Métricas del Dashboard

### KPIs
- Total leads, deals cerrados, close rate general, volumen promedio (solo leads que reportaron)

### Visualizaciones
- **Bar charts interactivos** (6 tabs): close rate por industria, vendedor, canal, preocupación, tamaño, caso de uso — click para filtrar
- **Mapa de oportunidad**: bubble chart con cuadrantes (Estrella / Oportunidad / Nicho / Bajo potencial)
- **Heatmaps**: Vendedor x Industria, Vendedor x Preocupación, Vendedor x Mes
- **Timeline**: leads y cierres por mes
- **Tabla de leads**: con búsqueda de texto y click para drill-down
- **Lead detail**: ficha completa con las 10 dimensiones + evidencia textual del LLM

### Interactividad
- Click en cualquier barra → filtra todo el dashboard por esa dimensión
- Búsqueda de texto libre → filtra por nombre, industria, vendedor, transcripción
- Click en un lead → muestra ficha detallada con cita textual de la transcripción

---

## Limitaciones y Next Steps

### Limitaciones de la data
- **N=60**: cualquier cruce con celdas < 5 debe interpretarse como señal, no conclusión
- **63% sin volumen**: las transcripciones no siempre incluyen números concretos. El dashboard marca "Sin dato" en vez de 0
- **Tamaño empresa**: 85% clasificado como "pyme" — la dimensión discrimina poco con esta data

### Con más tiempo haría
- **Signal Strength table**: feature importance — qué dimensiones correlacionan más con cierre
- **Vendor Playbook**: recomendaciones per-vendedor basadas en sus fortalezas/debilidades por vertical
- **Tests**: golden set de 5 transcripciones con extracciones esperadas para validar el prompt
- **Error boundary**: página de error si la DB no existe o está corrupta
- **Mobile responsive**: pase completo de responsive para charts
