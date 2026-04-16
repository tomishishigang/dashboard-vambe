"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import type { MetricGroup } from "@/lib/analytics";
import { formatLabel } from "@/lib/analytics";

interface Props {
  data: MetricGroup[];
  title: string;
  onBarClick?: (label: string) => void;
  activeFilter?: string;
}

// Coordinated color palette — indigo-based with good contrast
const PALETTE = [
  "#6366f1", "#818cf8", "#a5b4fc", "#7c3aed", "#8b5cf6",
  "#a78bfa", "#4f46e5", "#6d28d9", "#5b21b6", "#4338ca",
];

interface ChartEntry {
  name: string;
  rawLabel: string;
  closeRate: number;
  total: number;
  closed: number;
}

export function CloseRateBar({ data, title, onBarClick, activeFilter }: Props) {
  const chartData: ChartEntry[] = data.map((d) => ({
    name: formatLabel(d.label),
    rawLabel: d.label,
    closeRate: d.closeRate,
    total: d.total,
    closed: d.closed,
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            fontSize={11}
            stroke="#94a3b8"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            fontSize={12}
            tick={{ fill: "#475569", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as ChartEntry;
              return (
                <div className="bg-white/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-lg text-sm">
                  <p className="font-semibold text-foreground">{d.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-primary">{d.closeRate}%</span>
                    <span className="text-muted-foreground">
                      close rate ({d.closed}/{d.total})
                    </span>
                  </div>
                </div>
              );
            }}
          />
          <Bar
            dataKey="closeRate"
            radius={[0, 6, 6, 0]}
            cursor={onBarClick ? "pointer" : undefined}
            onClick={(_data, index) => {
              const entry = chartData[index];
              if (entry) onBarClick?.(entry.rawLabel);
            }}
            barSize={24}
          >
            {chartData.map((entry, i) => (
              <Cell
                key={entry.rawLabel}
                fill={
                  activeFilter
                    ? entry.rawLabel === activeFilter
                      ? PALETTE[0]
                      : "#e2e8f0"
                    : PALETTE[i % PALETTE.length]
                }
                opacity={activeFilter && entry.rawLabel !== activeFilter ? 0.5 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
