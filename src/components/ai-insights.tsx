"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InsightsData } from "@/lib/lead-service";

interface Props {
  data: InsightsData;
}

const CATEGORIA_CONFIG: Record<string, { label: string; color: string }> = {
  asignacion: { label: "Asignación", color: "bg-violet-100 text-violet-700" },
  canal: { label: "Canal", color: "bg-blue-100 text-blue-700" },
  industria: { label: "Industria", color: "bg-emerald-100 text-emerald-700" },
  requerimiento: { label: "Requerimiento", color: "bg-amber-100 text-amber-700" },
  oportunidad: { label: "Oportunidad", color: "bg-rose-100 text-rose-700" },
};

export function AIInsights({ data }: Props) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-4">
        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
          <svg className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Conclusiones Generadas con IA</h3>
          <p className="text-[11px] text-muted-foreground/60">
            Análisis automatizado basado en los datos agregados del pipeline
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.insights.map((insight, i) => {
          const config = CATEGORIA_CONFIG[insight.categoria] ?? { label: insight.categoria, color: "bg-muted text-muted-foreground" };
          return (
            <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Badge className={`${config.color} border-0 text-[10px] font-semibold mb-2`}>
                  {config.label}
                </Badge>
                <h4 className="font-semibold text-sm text-foreground leading-snug">
                  {insight.titulo}
                </h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {insight.descripcion}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
