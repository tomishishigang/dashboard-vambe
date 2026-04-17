"use client";

import type { MetricGroup } from "@/lib/analytics";
import { formatLabel } from "@/lib/analytics";

interface Props {
  data: MetricGroup[];
  title: string;
  colorClass: string;
  minN?: number;
}

export function InsightCard({ data, title, colorClass, minN = 1 }: Props) {
  const filtered = data.filter((d) => d.total >= minN);
  if (filtered.length === 0) return null;
  // At equal close rate, prefer the one with more leads (more statistically reliable)
  const best = filtered.reduce((a, b) =>
    a.closeRate !== b.closeRate
      ? (a.closeRate > b.closeRate ? a : b)
      : (a.total > b.total ? a : b)
  );

  return (
    <div className={`border-l-[3px] ${colorClass} pl-3 py-1`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className="font-semibold text-sm mt-0.5">
        {formatLabel(best.label)}
      </p>
      <p className="text-xs text-muted-foreground">
        {best.closeRate}% close rate
        <span className="opacity-60"> ({best.closed}/{best.total})</span>
      </p>
    </div>
  );
}
