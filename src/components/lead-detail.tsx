"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import { formatLabel, parseIntegrations } from "@/lib/analytics";
import type { LeadRow } from "@/db";

interface Props {
  lead: LeadRow;
  onClose: () => void;
}

export function LeadDetail({ lead, onClose }: Props) {
  const integraciones = parseIntegrations(lead.integraciones_requeridas);

  return (
    <Card className="border-primary/20 bg-primary/[0.02] shadow-sm h-[420px] overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{lead.nombre}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lead.correo} &middot; {lead.telefono}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none px-1"
          >
            &times;
          </button>
        </div>
        <div className="flex gap-2 flex-wrap mt-2">
          <StatusBadge closed={!!lead.closed} />
          <Badge variant="secondary">{lead.vendedor}</Badge>
          <Badge variant="secondary">{lead.fecha_reunion}</Badge>
          <Badge variant="secondary" className="tabular-nums">
            {Math.round(lead.confianza_extraccion * 100)}% confianza
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoItem label="Industria" value={formatLabel(lead.industria)} />
          <InfoItem label="Tamaño Empresa" value={formatLabel(lead.tamano_empresa)} />
          <InfoItem label="Caso de Uso" value={formatLabel(lead.caso_uso_primario)} />
          <InfoItem label="Canal" value={formatLabel(lead.canal_descubrimiento)} />
          <InfoItem label="Estacionalidad" value={formatLabel(lead.estacionalidad)} />
          <InfoItem label="Madurez Digital" value={formatLabel(lead.madurez_digital)} />
          <InfoItem label="Sector Regulado" value={lead.sector_regulado ? "Sí" : "No"} />
          <InfoItem
            label="Vol. Mensual"
            value={lead.volumen_mensual_estimado > 0 ? lead.volumen_mensual_estimado.toLocaleString() : "Sin dato"}
            muted={lead.volumen_mensual_estimado === 0}
          />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Requerimiento Clave
          </p>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0">
            {formatLabel(lead.preocupacion_principal)}
          </Badge>
        </div>

        {integraciones.length > 0 && integraciones[0] !== "ninguna_mencionada" && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Integraciones Requeridas
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {integraciones.map((i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {formatLabel(i)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Evidencia
          </p>
          <blockquote className="text-sm leading-relaxed border-l-[3px] border-primary/30 pl-4 text-muted-foreground italic">
            &ldquo;{lead.evidencia}&rdquo;
          </blockquote>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-medium text-sm mt-0.5 ${muted ? "text-muted-foreground/50 italic" : ""}`}>{value}</p>
    </div>
  );
}
