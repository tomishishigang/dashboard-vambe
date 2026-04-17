import type { LeadRow } from "@/db";

// ── Shared utilities ──

export function calculateCloseRate(closed: number, total: number): number {
  return total === 0 ? 0 : Math.round((closed / total) * 100);
}

export function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/(^|\s)\w/g, (c) => c.toUpperCase());
}

export function safeAverage(values: number[]): number {
  return values.length === 0 ? 0 : Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

export function parseIntegrations(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Types ──

export interface MetricGroup {
  label: string;
  total: number;
  closed: number;
  closeRate: number;
  avgVolume: number;
  avgConfidence: number;
}

export interface TimelinePoint {
  month: string;
  total: number;
  closed: number;
  closeRate: number;
}

export interface DashboardData {
  summary: {
    totalLeads: number;
    totalClosed: number;
    overallCloseRate: number;
    avgVolume: number;
    leadsWithVolume: number;
    avgConfidence: number;
  };
  byIndustria: MetricGroup[];
  byVendedor: MetricGroup[];
  byCanal: MetricGroup[];
  byPreocupacion: MetricGroup[];
  byTamano: MetricGroup[];
  byCasoUso: MetricGroup[];
  byEstacionalidad: MetricGroup[];
  timeline: TimelinePoint[];
}

// ── Aggregation ──

function groupBy(leads: LeadRow[], key: keyof LeadRow, labelFn?: (lead: LeadRow) => string): MetricGroup[] {
  const groups = new Map<string, LeadRow[]>();

  for (const lead of leads) {
    const value = labelFn ? labelFn(lead) : String(lead[key]);
    const list = groups.get(value) ?? [];
    list.push(lead);
    groups.set(value, list);
  }

  return Array.from(groups.entries())
    .map(([label, items]) => {
      const closed = items.filter((l) => l.closed === 1).length;
      const volumes = items.map((l) => l.volumen_mensual_estimado);
      const confidences = items.map((l) => l.confianza_extraccion);
      return {
        label,
        total: items.length,
        closed,
        closeRate: calculateCloseRate(closed, items.length),
        avgVolume: safeAverage(volumes),
        avgConfidence: Math.round(safeAverage(confidences.map((c) => c * 100))) / 100,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function buildTimeline(leads: LeadRow[]): TimelinePoint[] {
  const months = new Map<string, { total: number; closed: number }>();

  for (const lead of leads) {
    const month = lead.fecha_reunion.slice(0, 7);
    const entry = months.get(month) ?? { total: 0, closed: 0 };
    entry.total++;
    if (lead.closed === 1) entry.closed++;
    months.set(month, entry);
  }

  return Array.from(months.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      total: data.total,
      closed: data.closed,
      closeRate: calculateCloseRate(data.closed, data.total),
    }));
}

// ── Main builder ──

export function buildDashboardData(leads: LeadRow[]): DashboardData {
  const totalClosed = leads.filter((l) => l.closed === 1).length;
  const leadsWithVolume = leads.filter((l) => l.volumen_mensual_estimado > 0);

  return {
    summary: {
      totalLeads: leads.length,
      totalClosed,
      overallCloseRate: calculateCloseRate(totalClosed, leads.length),
      avgVolume: safeAverage(leadsWithVolume.map((l) => l.volumen_mensual_estimado)),
      leadsWithVolume: leadsWithVolume.length,
      avgConfidence:
        Math.round(safeAverage(leads.map((l) => l.confianza_extraccion * 100))) / 100,
    },
    byIndustria: groupBy(leads, "industria"),
    byVendedor: groupBy(leads, "vendedor"),
    byCanal: groupBy(leads, "canal_descubrimiento"),
    byPreocupacion: groupBy(leads, "preocupacion_principal"),
    byTamano: groupBy(leads, "tamano_empresa"),
    byCasoUso: groupBy(leads, "caso_uso_primario"),
    byEstacionalidad: groupBy(leads, "estacionalidad"),
    timeline: buildTimeline(leads),
  };
}
