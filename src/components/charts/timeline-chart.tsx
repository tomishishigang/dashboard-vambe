"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TimelinePoint } from "@/lib/analytics";

interface Props {
  data: TimelinePoint[];
}

export function TimelineChart({ data }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Leads y Cierre por Mes
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: 0, right: 10, top: 5 }}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a5b4fc" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a5b4fc" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradClosed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            fontSize={11}
            stroke="#94a3b8"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            fontSize={11}
            stroke="#94a3b8"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as TimelinePoint;
              return (
                <div className="bg-white/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-lg text-sm">
                  <p className="font-semibold text-foreground">{label}</p>
                  <p className="text-muted-foreground mt-1">
                    {d.total} leads, {d.closed} cerrados ({d.closeRate}%)
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#a5b4fc"
            strokeWidth={2}
            fill="url(#gradTotal)"
            name="Total Leads"
          />
          <Area
            type="monotone"
            dataKey="closed"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#gradClosed)"
            name="Cerrados"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
