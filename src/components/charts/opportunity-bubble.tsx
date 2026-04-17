"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Label,
} from "recharts";
import type { MetricGroup } from "@/lib/analytics";
import { formatLabel } from "@/lib/analytics";

interface Props {
  data: MetricGroup[];
  title: string;
  overallCloseRate: number;
}

type Quadrant = "star" | "niche" | "opportunity" | "low";

const QUADRANT_COLORS: Record<Quadrant, { fill: string; stroke: string }> = {
  star: { fill: "#22c55e", stroke: "#16a34a" },
  niche: { fill: "#6366f1", stroke: "#4f46e5" },
  opportunity: { fill: "#f59e0b", stroke: "#d97706" },
  low: { fill: "#94a3b8", stroke: "#64748b" },
};

const QUADRANT_LABELS: Record<Quadrant, string> = {
  star: "Estrella",
  niche: "Nicho rentable",
  opportunity: "Oportunidad",
  low: "Bajo potencial",
};

/** Only these quadrants get visible labels — the rest show on hover */
const LABELED_QUADRANTS: Set<Quadrant> = new Set(["star", "opportunity"]);

interface BubbleEntry {
  name: string;
  shortName: string;
  x: number;
  y: number;
  z: number;
  total: number;
  closed: number;
  avgVolume: number;
  quadrant: Quadrant;
  showLabel: boolean;
}

/**
 * Apply horizontal jitter to separate points with the same x value.
 * Groups by x, then offsets each item in the group symmetrically around x.
 */
function applyJitter(data: BubbleEntry[], jitterAmount = 0.3): BubbleEntry[] {
  const byX = new Map<number, BubbleEntry[]>();
  for (const d of data) {
    const group = byX.get(d.x) ?? [];
    group.push(d);
    byX.set(d.x, group);
  }

  for (const [, group] of byX) {
    if (group.length <= 1) continue;
    // Sort by y so jitter is predictable
    group.sort((a, b) => a.y - b.y);
    const step = jitterAmount / Math.max(group.length - 1, 1);
    const offset = -jitterAmount / 2;
    group.forEach((entry, i) => {
      entry.x += offset + step * i;
    });
  }

  return data;
}

export function OpportunityBubble({ data, title, overallCloseRate }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No hay datos para mostrar.</p>
      </div>
    );
  }

  const avgLeads = Math.round(data.reduce((s, d) => s + d.total, 0) / data.length);

  const chartData: BubbleEntry[] = applyJitter(
    data.map((d) => {
      const isHighDemand = d.total >= avgLeads;
      const isHighClose = d.closeRate >= overallCloseRate;
      let quadrant: Quadrant;
      if (isHighDemand && isHighClose) quadrant = "star";
      else if (!isHighDemand && isHighClose) quadrant = "niche";
      else if (isHighDemand && !isHighClose) quadrant = "opportunity";
      else quadrant = "low";

      const label = formatLabel(d.label);
      return {
        name: label,
        shortName: label.length > 16 ? label.slice(0, 14) + "…" : label,
        x: d.total,
        y: d.closeRate,
        z: Math.max(d.total * 150, 300),
        total: d.total,
        closed: d.closed,
        avgVolume: d.avgVolume,
        quadrant,
        showLabel: LABELED_QUADRANTS.has(quadrant),
      };
    })
  );

  const maxLeads = Math.max(...chartData.map((d) => d.x));

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Cada burbuja es una industria. Labels visibles solo en
        <span className="font-semibold text-emerald-600"> Estrellas</span> y
        <span className="font-semibold text-amber-600"> Oportunidades</span>.
        Hover sobre el resto para ver detalle.
      </p>

      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, maxLeads + 2]}
            fontSize={11}
            stroke="#94a3b8"
            axisLine={false}
            tickLine={false}
          >
            <Label value="Cantidad de leads (demanda)" position="bottom" offset={10} style={{ fontSize: 11, fill: "#64748b" }} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 105]}
            tickFormatter={(v) => `${v}%`}
            fontSize={11}
            stroke="#94a3b8"
            axisLine={false}
            tickLine={false}
          >
            <Label value="Close Rate" angle={-90} position="insideLeft" offset={5} style={{ fontSize: 11, fill: "#64748b" }} />
          </YAxis>
          <ZAxis type="number" dataKey="z" range={[250, 1400]} />

          {/* Quadrant dividers */}
          <ReferenceLine y={overallCloseRate} stroke="#6366f1" strokeDasharray="6 4" strokeWidth={1.5}>
            <Label value={`Prom. ${overallCloseRate}%`} position="right" style={{ fontSize: 10, fill: "#6366f1", fontWeight: 600 }} />
          </ReferenceLine>
          <ReferenceLine x={avgLeads} stroke="#a5b4fc" strokeDasharray="4 4" strokeWidth={1}>
            <Label value={`Prom. ${avgLeads}`} position="top" style={{ fontSize: 10, fill: "#818cf8" }} />
          </ReferenceLine>

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as BubbleEntry;
              return (
                <div className="bg-white/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-lg text-sm max-w-[260px]">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: QUADRANT_COLORS[d.quadrant].fill }}
                    />
                    <p className="font-semibold text-foreground">{d.name}</p>
                  </div>
                  <div className="mt-2 space-y-1 text-muted-foreground text-xs">
                    <p>
                      <span className="font-medium text-foreground">{d.total}</span> leads,{" "}
                      <span className="font-medium text-foreground">{d.closed}</span> cerrados (
                      <span className="font-medium text-foreground">{d.y}%</span>)
                    </p>
                    {d.avgVolume > 0 && (
                      <p>
                        Vol. promedio:{" "}
                        <span className="font-medium text-foreground">{d.avgVolume.toLocaleString()}</span>/mes
                      </p>
                    )}
                    <p className="font-semibold mt-1" style={{ color: QUADRANT_COLORS[d.quadrant].stroke }}>
                      {QUADRANT_LABELS[d.quadrant]}
                    </p>
                  </div>
                </div>
              );
            }}
          />

          <Scatter
            data={chartData}
            isAnimationActive={false}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shape={(props: any) => {
              const cx = (props.cx as number) ?? 0;
              const cy = (props.cy as number) ?? 0;
              const payload = props.payload as BubbleEntry;
              const r = Math.max(8, Math.min(22, payload.total * 3));
              const colors = QUADRANT_COLORS[payload.quadrant];

              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={colors.fill}
                    fillOpacity={payload.showLabel ? 0.8 : 0.5}
                    stroke={colors.stroke}
                    strokeWidth={payload.showLabel ? 2.5 : 1.5}
                  />
                  {payload.showLabel && (
                    <>
                      {/* Connector line */}
                      <line
                        x1={cx}
                        y1={cy - r}
                        x2={cx}
                        y2={cy - r - 10}
                        stroke={colors.stroke}
                        strokeWidth={1}
                        opacity={0.4}
                      />
                      {/* Label with background */}
                      <rect
                        x={cx - payload.shortName.length * 3.2}
                        y={cy - r - 26}
                        width={payload.shortName.length * 6.4}
                        height={16}
                        rx={4}
                        fill="white"
                        fillOpacity={0.9}
                        stroke={colors.stroke}
                        strokeWidth={0.5}
                        strokeOpacity={0.3}
                      />
                      <text
                        x={cx}
                        y={cy - r - 14}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={600}
                        fill={colors.stroke}
                      >
                        {payload.shortName}
                      </text>
                    </>
                  )}
                </g>
              );
            }}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={QUADRANT_COLORS[entry.quadrant].fill} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
        {(Object.entries(QUADRANT_LABELS) as [Quadrant, string][]).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-3.5 h-3.5 rounded-full border-2"
              style={{
                backgroundColor: QUADRANT_COLORS[key].fill,
                borderColor: QUADRANT_COLORS[key].stroke,
                opacity: LABELED_QUADRANTS.has(key) ? 1 : 0.5,
              }}
            />
            <span className={`font-medium ${LABELED_QUADRANTS.has(key) ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
        ))}
        <span className="text-muted-foreground/60 ml-2">Hover para ver todas</span>
      </div>
    </div>
  );
}
