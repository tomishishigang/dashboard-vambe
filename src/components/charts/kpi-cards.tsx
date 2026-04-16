"use client";

import { Card, CardContent } from "@/components/ui/card";

interface KPI {
  label: string;
  value: string | number;
  sublabel?: string;
}

interface Props {
  kpis: KPI[];
}

export function KPICards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
            <p className="text-3xl font-bold mt-2 tracking-tight text-foreground">
              {kpi.value}
            </p>
            {kpi.sublabel && (
              <p className="text-xs text-muted-foreground mt-1">{kpi.sublabel}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
