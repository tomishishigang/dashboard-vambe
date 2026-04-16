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
  star: { fill: "#22c55e", stroke: "#16a34a" },        // green
  niche: { fill: "#6366f1", stroke: "#4f46e5" },       // indigo
  opportunity: { fill: "#f59e0b", stroke: "#d97706" },  // amber
  low: { fill: "#94a3b8", stroke: "#64748b" },          // gray
};

const QUADRANT_LABELS: Record<Quadrant, string> = {
  star: "Estrella",
  niche: "Nicho rentable",
  opportunity: "Oportunidad",
  low: "Bajo potencial",
};

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
}

interface LabelPos {
  dx: number;
  dy: number;
  anchor: "middle" | "start" | "end";
}

/**
 * Simple collision avoidance for scatter labels.
 * Groups points that are close together and fans out their labels.
 */
function computeLabelPositions(data: BubbleEntry[]): Map<string, LabelPos> {
  const positions = new Map<string, LabelPos>();
  const threshold = 1.5; // proximity threshold in data units

  // Sort by x for consistent processing
  const sorted = [...data].sort((a, b) => a.x - b.x || a.y - b.y);

  // Find clusters of nearby points
  const assigned = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    if (assigned.has(sorted[i].name)) continue;

    const cluster = [sorted[i]];
    for (let j = i + 1; j < sorted.length; j++) {
      if (assigned.has(sorted[j].name)) continue;
      const dx = Math.abs(sorted[i].x - sorted[j].x);
      const dy = Math.abs(sorted[i].y - sorted[j].y);
      if (dx <= threshold && dy <= 15) {
        cluster.push(sorted[j]);
      }
    }

    if (cluster.length === 1) {
      // No collision — label on top
      const r = Math.max(8, Math.min(20, cluster[0].total * 3));
      positions.set(cluster[0].name, { dx: 0, dy: -r - 8, anchor: "middle" });
      assigned.add(cluster[0].name);
    } else {
      // Fan out labels around the cluster
      const placements: LabelPos[] = [
        { dx: 0, dy: -28, anchor: "middle" },    // top
        { dx: 0, dy: 22, anchor: "middle" },      // bottom
        { dx: 30, dy: -4, anchor: "start" },      // right
        { dx: -30, dy: -4, anchor: "end" },        // left
        { dx: 25, dy: -20, anchor: "start" },     // top-right
        { dx: -25, dy: -20, anchor: "end" },       // top-left
      ];
      cluster.forEach((entry, idx) => {
        positions.set(entry.name, placements[idx % placements.length]);
        assigned.add(entry.name);
      });
    }
  }

  return positions;
}

export function OpportunityBubble({ data, title, overallCloseRate }: Props) {
  const avgLeads = Math.round(data.reduce((s, d) => s + d.total, 0) / data.length);

  const chartData: BubbleEntry[] = data.map((d) => {
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
      shortName: label.length > 14 ? label.slice(0, 12) + "..." : label,
      x: d.total,
      y: d.closeRate,
      z: Math.max(d.total * 150, 300),
      total: d.total,
      closed: d.closed,
      avgVolume: d.avgVolume,
      quadrant,
    };
  });

  const maxLeads = Math.max(...chartData.map((d) => d.x));

  // Simple collision avoidance: assign label positions
  // Sort by x,y and alternate top/bottom for points that are close
  const labelPositions = computeLabelPositions(chartData);

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Cada burbuja es una industria. Posición = demanda vs cierre. Color = clasificación estratégica.
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
            <Label value={`Close rate prom. ${overallCloseRate}%`} position="right" style={{ fontSize: 10, fill: "#6366f1", fontWeight: 600 }} />
          </ReferenceLine>
          <ReferenceLine x={avgLeads} stroke="#a5b4fc" strokeDasharray="4 4" strokeWidth={1}>
            <Label value={`Demanda prom. ${avgLeads}`} position="top" style={{ fontSize: 10, fill: "#818cf8" }} />
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
                    <p><span className="font-medium text-foreground">{d.total}</span> leads, <span className="font-medium text-foreground">{d.closed}</span> cerrados (<span className="font-medium text-foreground">{d.y}%</span>)</p>
                    {d.avgVolume > 0 && (
                      <p>Vol. promedio: <span className="font-medium text-foreground">{d.avgVolume.toLocaleString()}</span>/mes</p>
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
              const pos = labelPositions.get(payload.name);
              const r = Math.max(8, Math.min(20, payload.total * 3));
              const colors = QUADRANT_COLORS[payload.quadrant];
              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={colors.fill}
                    fillOpacity={0.7}
                    stroke={colors.stroke}
                    strokeWidth={2}
                  />
                  <text
                    x={cx + (pos?.dx ?? 0)}
                    y={cy + (pos?.dy ?? -r - 8)}
                    textAnchor={pos?.anchor ?? "middle"}
                    fontSize={10}
                    fontWeight={500}
                    fill="#334155"
                  >
                    {payload.shortName}
                  </text>
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
                opacity: 0.8,
              }}
            />
            <span className="text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
