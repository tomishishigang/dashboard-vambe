"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { KPICards } from "@/components/charts/kpi-cards";
import { CloseRateBar } from "@/components/charts/close-rate-bar";
import { TimelineChart } from "@/components/charts/timeline-chart";
import { Heatmap } from "@/components/charts/heatmap";
import { OpportunityBubble } from "@/components/charts/opportunity-bubble";
import { InsightCard } from "@/components/charts/insight-card";
import { LeadsTable } from "@/components/leads-table";
import { AIInsights } from "@/components/ai-insights";
import { LeadDetail } from "@/components/lead-detail";
import { useDashboardFilter } from "@/hooks/use-dashboard-filter";
import { formatLabel, buildTimeline, type DashboardData, type TimelinePoint } from "@/lib/analytics";
import type { InsightsData } from "@/lib/lead-service";
import type { LeadRow } from "@/db";

interface Props {
  data: DashboardData;
  leads: LeadRow[];
  aiInsights?: InsightsData;
}

export function Dashboard({ data, leads, aiInsights }: Props) {
  const {
    filter,
    searchQuery,
    setSearchQuery,
    filteredLeads,
    filteredSummary,
    selectedLead,
    setSelectedLead,
    toggleFilter,
    clearFilter,
    hasActiveFilters,
  } = useDashboardFilter(leads);

  const leadsWithMonth = useMemo(
    () => filteredLeads.map((l) => ({ ...l, mes: l.fecha_reunion.slice(0, 7) })),
    [filteredLeads],
  );

  const filteredTimeline = useMemo(
    () => buildTimeline(filteredLeads),
    [filteredLeads],
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <img src="/vambe-logo.png" alt="Vambe" className="h-8 w-8 rounded-lg" />
              <h1 className="text-2xl font-bold tracking-tight">Lead Intelligence</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              Análisis de {data.summary.totalLeads} leads extraídos con IA*
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 max-w-xl">
          <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, industria, vendedor, transcripción..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground text-sm"
            >
              &times;
            </button>
          )}
          </div>
          <span className="text-[11px] text-muted-foreground/50 whitespace-nowrap flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtra todo el dashboard
          </span>
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground/50">Filtros activos:</span>
            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery("")}
                className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-md transition-colors font-medium"
              >
                Búsqueda: &ldquo;{searchQuery.trim().length > 20 ? searchQuery.trim().slice(0, 20) + "…" : searchQuery.trim()}&rdquo;
                <span className="text-primary/60">&times;</span>
              </button>
            )}
            {filter && (
              <button
                onClick={clearFilter}
                className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-md transition-colors font-medium"
              >
                {formatLabel(filter.key)}: {formatLabel(filter.value)}
                <span className="text-primary/60">&times;</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* KPIs */}
      <KPICards
        kpis={[
          {
            label: "Total Leads",
            value: filteredSummary.total,
            sublabel: filter ? `de ${data.summary.totalLeads} totales` : undefined,
          },
          {
            label: "Close Rate",
            value: `${filteredSummary.closeRate}%`,
            sublabel: `${filteredSummary.closed} de ${filteredSummary.total}`,
          },
          {
            label: "Industrias Cubiertas",
            value: data.byIndustria.length,
            sublabel: `de ${data.summary.totalLeads} leads analizados`,
          },
          {
            label: "Interacciones Prom./Mes",
            value: data.summary.avgVolume.toLocaleString(),
            sublabel: `Consultas de clientes (${data.summary.leadsWithVolume} leads reportaron)`,
          },
        ]}
      />

      {/* AI footnote */}
      <p className="text-[11px] text-muted-foreground/60">
        *Categorización automática mediante LLM. Confianza promedio de extracción: <span className="font-medium">{Math.round(data.summary.avgConfidence * 100)}%</span>.
      </p>

      {/* Charts + Insights */}
      <Tabs defaultValue="industria" className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
        <TabsList className="bg-muted p-1 flex flex-wrap h-auto gap-0.5 rounded-xl">
          <TabsTrigger value="industria" className="text-xs">Industria</TabsTrigger>
          <TabsTrigger value="vendedor" className="text-xs">Vendedor</TabsTrigger>
          <TabsTrigger value="canal" className="text-xs">Canal</TabsTrigger>
          <TabsTrigger value="preocupacion" className="text-xs">Req. Clave</TabsTrigger>
          <TabsTrigger value="tamano" className="text-xs">Tamaño</TabsTrigger>
          <TabsTrigger value="caso_uso" className="text-xs">Caso de Uso</TabsTrigger>
          <TabsTrigger value="estacionalidad" className="text-xs">Estacionalidad</TabsTrigger>
          <TabsTrigger value="madurez" className="text-xs">Madurez Digital</TabsTrigger>
        </TabsList>
        <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          Click en las barras para filtrar
        </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm">
            <CardContent className="pt-6">
              <TabsContent value="industria" className="mt-0">
                <CloseRateBar data={data.byIndustria} title="Close Rate por Industria" onBarClick={(v) => toggleFilter("industria", v)} activeFilter={filter?.key === "industria" ? filter.value : undefined} />
              </TabsContent>
              <TabsContent value="vendedor" className="mt-0">
                <CloseRateBar data={data.byVendedor} title="Close Rate por Vendedor" onBarClick={(v) => toggleFilter("vendedor", v)} activeFilter={filter?.key === "vendedor" ? filter.value : undefined} />
              </TabsContent>
              <TabsContent value="canal" className="mt-0">
                <CloseRateBar data={data.byCanal} title="Close Rate por Canal" onBarClick={(v) => toggleFilter("canal_descubrimiento", v)} activeFilter={filter?.key === "canal_descubrimiento" ? filter.value : undefined} />
              </TabsContent>
              <TabsContent value="preocupacion" className="mt-0">
                <CloseRateBar data={data.byPreocupacion} title="Close Rate por Req. Clave" onBarClick={(v) => toggleFilter("preocupacion_principal", v)} activeFilter={filter?.key === "preocupacion_principal" ? filter.value : undefined} />
              </TabsContent>
              <TabsContent value="tamano" className="mt-0">
                <CloseRateBar data={data.byTamano} title="Close Rate por Tamaño" onBarClick={(v) => toggleFilter("tamano_empresa", v)} activeFilter={filter?.key === "tamano_empresa" ? filter.value : undefined} />
              </TabsContent>
              <TabsContent value="caso_uso" className="mt-0">
                <CloseRateBar data={data.byCasoUso} title="Close Rate por Caso de Uso" onBarClick={(v) => toggleFilter("caso_uso_primario", v)} activeFilter={filter?.key === "caso_uso_primario" ? filter.value : undefined} />
              </TabsContent>
              <TabsContent value="estacionalidad" className="mt-0">
                <CloseRateBar data={data.byEstacionalidad} title="Close Rate por Estacionalidad" onBarClick={(v) => toggleFilter("estacionalidad", v)} activeFilter={filter?.key === "estacionalidad" ? filter.value : undefined} />
              </TabsContent>
              <TabsContent value="madurez" className="mt-0">
                <CloseRateBar data={data.byMadurezDigital} title="Close Rate por Madurez Digital" onBarClick={(v) => toggleFilter("madurez_digital", v)} activeFilter={filter?.key === "madurez_digital" ? filter.value : undefined} />
              </TabsContent>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Insights Clave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InsightCard data={data.byVendedor} title="Top Vendedor" colorClass="border-l-violet-500" />
              <InsightCard data={data.byCanal} title="Mejor Canal" colorClass="border-l-indigo-500" />
              <InsightCard data={data.byIndustria} title="Mejor Industria" colorClass="border-l-purple-500" minN={4} />
              <InsightCard data={data.byPreocupacion} title="Req. Clave que más Cierra" colorClass="border-l-fuchsia-500" minN={3} />
              <InsightCard data={data.byTamano} title="Mejor Tamaño de Empresa" colorClass="border-l-sky-500" minN={5} />
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Heatmaps */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <Heatmap leads={filteredLeads} rowKey="vendedor" colKey="industria" title="Vendedor x Industria" rowLabel="Vendedor" colLabel="Industria" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <Heatmap leads={filteredLeads} rowKey="vendedor" colKey="preocupacion_principal" title="Vendedor x Req. Clave" rowLabel="Vendedor" colLabel="Req. Clave" />
          </CardContent>
        </Card>
      </div>

      {/* Vendor x Month */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <Heatmap leads={leadsWithMonth} rowKey="vendedor" colKey="mes" title="Vendedor x Mes" rowLabel="Vendedor" colLabel="Mes" colSortAlpha />
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <TimelineChart data={filteredTimeline} />
        </CardContent>
      </Card>

      {/* Opportunity Analysis */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <OpportunityBubble data={data.byIndustria} title="Mapa de Oportunidad por Industria" overallCloseRate={data.summary.overallCloseRate} />
        </CardContent>
      </Card>

      {/* AI Insights */}
      {aiInsights && (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <AIInsights data={aiInsights} />
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">
                Leads
                <Badge variant="secondary" className="ml-2 font-normal">
                  {filteredLeads.length}
                </Badge>
              </CardTitle>
              <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Click en un lead para ver detalle
              </span>
            </div>
            {filter && (
              <p className="text-xs text-muted-foreground">
                Filtrado por {filter.key.replace(/_/g, " ")}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedLead && (
            <div className="mb-4">
              <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />
            </div>
          )}
          <LeadsTable leads={filteredLeads} onLeadClick={setSelectedLead} />
        </CardContent>
      </Card>
    </div>
  );
}
