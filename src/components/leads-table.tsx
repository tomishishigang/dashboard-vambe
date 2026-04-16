"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatLabel } from "@/lib/analytics";
import type { LeadRow } from "@/db";

interface Props {
  leads: LeadRow[];
  onLeadClick?: (lead: LeadRow) => void;
}

export function LeadsTable({ leads, onLeadClick }: Props) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No hay leads que coincidan con el filtro.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-auto max-h-[480px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="sticky top-0 bg-muted/30 backdrop-blur-sm font-semibold text-xs uppercase tracking-wider">Nombre</TableHead>
            <TableHead className="sticky top-0 bg-muted/30 backdrop-blur-sm font-semibold text-xs uppercase tracking-wider">Industria</TableHead>
            <TableHead className="sticky top-0 bg-muted/30 backdrop-blur-sm font-semibold text-xs uppercase tracking-wider">Vendedor</TableHead>
            <TableHead className="sticky top-0 bg-muted/30 backdrop-blur-sm font-semibold text-xs uppercase tracking-wider">Canal</TableHead>
            <TableHead className="sticky top-0 bg-muted/30 backdrop-blur-sm font-semibold text-xs uppercase tracking-wider text-right">Vol./mes</TableHead>
            <TableHead className="sticky top-0 bg-muted/30 backdrop-blur-sm font-semibold text-xs uppercase tracking-wider text-center">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => onLeadClick?.(lead)}
            >
              <TableCell className="font-medium text-sm">{lead.nombre}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs font-normal">
                  {formatLabel(lead.industria)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{lead.vendedor}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatLabel(lead.canal_descubrimiento)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {lead.volumen_mensual_estimado > 0
                  ? lead.volumen_mensual_estimado.toLocaleString()
                  : <span className="text-muted-foreground/50">Sin dato</span>
                }
              </TableCell>
              <TableCell className="text-center">
                <StatusBadge closed={!!lead.closed} size="sm" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
