"use client";

import { useState, useMemo } from "react";
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

type SortKey = "nombre" | "industria" | "vendedor" | "canal_descubrimiento" | "volumen_mensual_estimado" | "closed";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; align?: "right" | "center" }[] = [
  { key: "nombre", label: "Nombre" },
  { key: "industria", label: "Industria" },
  { key: "vendedor", label: "Vendedor" },
  { key: "canal_descubrimiento", label: "Canal" },
  { key: "volumen_mensual_estimado", label: "Vol./mes", align: "right" },
  { key: "closed", label: "Estado", align: "center" },
];

function compareLead(a: LeadRow, b: LeadRow, key: SortKey, dir: SortDir): number {
  const av = a[key];
  const bv = b[key];
  let cmp: number;
  if (typeof av === "number" && typeof bv === "number") {
    cmp = av - bv;
  } else {
    cmp = String(av).localeCompare(String(bv));
  }
  return dir === "asc" ? cmp : -cmp;
}

export function LeadsTable({ leads, onLeadClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sortedLeads = useMemo(
    () => [...leads].sort((a, b) => compareLead(a, b, sortKey, sortDir)),
    [leads, sortKey, sortDir],
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

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
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={`sticky top-0 bg-muted/30 backdrop-blur-sm font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors ${
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""
                }`}
                onClick={() => handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key && (
                    <span className="text-primary text-[10px]">
                      {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLeads.map((lead) => (
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
