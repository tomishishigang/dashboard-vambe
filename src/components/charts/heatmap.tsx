"use client";

import { useMemo } from "react";
import { formatLabel, calculateCloseRate } from "@/lib/analytics";

interface Props<T extends { closed: number } = { closed: number; [key: string]: unknown }> {
  leads: T[];
  rowKey: string & keyof T;
  colKey: string & keyof T;
  title: string;
  rowLabel?: string;
  colLabel?: string;
  /** Sort columns alphabetically/chronologically instead of by count */
  colSortAlpha?: boolean;
}

interface CellData {
  total: number;
  closed: number;
  closeRate: number;
}

function getColor(rate: number, total: number): string {
  if (total === 0) return "transparent";
  // Diverging scale: red (0%) → yellow (50%) → green (100%)
  if (rate <= 50) {
    const t = rate / 50;
    const r = 220;
    const g = Math.round(80 + t * 140);
    const b = Math.round(60 + t * 40);
    return `rgba(${r}, ${g}, ${b}, ${0.25 + (total / 16) * 0.55})`;
  }
  const t = (rate - 50) / 50;
  const r = Math.round(220 - t * 140);
  const g = Math.round(220 - t * 30);
  const b = Math.round(100 - t * 30);
  return `rgba(${r}, ${g}, ${b}, ${0.25 + (total / 16) * 0.55})`;
}

export function Heatmap<T extends { closed: number }>({ leads, rowKey, colKey, title, rowLabel, colLabel, colSortAlpha }: Props<T>) {
  const { rows, cols, matrix } = useMemo(() => {
    const rowSet = new Map<string, number>();
    const colSet = new Map<string, number>();
    const cells = new Map<string, CellData>();

    for (const lead of leads) {
      const r = String(lead[rowKey]);
      const c = String(lead[colKey]);
      rowSet.set(r, (rowSet.get(r) ?? 0) + 1);
      colSet.set(c, (colSet.get(c) ?? 0) + 1);

      const key = `${r}|${c}`;
      const cell = cells.get(key) ?? { total: 0, closed: 0, closeRate: 0 };
      cell.total++;
      if (lead.closed === 1) cell.closed++;
      cell.closeRate = calculateCloseRate(cell.closed, cell.total);
      cells.set(key, cell);
    }

    const rows = Array.from(rowSet.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    const cols = Array.from(colSet.entries())
      .sort(colSortAlpha
        ? (a, b) => a[0].localeCompare(b[0])
        : (a, b) => b[1] - a[1]
      )
      .map(([k]) => k);

    return { rows, cols, matrix: cells };
  }, [leads, rowKey, colKey]);

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {colLabel && rowLabel && (
        <p className="text-xs text-muted-foreground mb-4">
          {rowLabel} (filas) vs {colLabel} (columnas) — color = close rate, intensidad = volumen
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 font-semibold text-muted-foreground min-w-[140px]">
                {rowLabel ?? ""}
              </th>
              {cols.map((col) => (
                <th
                  key={col}
                  className="p-2 font-semibold text-muted-foreground text-center min-w-[80px]"
                >
                  <span className="inline-block max-w-[80px] truncate">
                    {formatLabel(col)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td className="p-2 font-medium text-foreground whitespace-nowrap">
                  {formatLabel(row)}
                </td>
                {cols.map((col) => {
                  const cell = matrix.get(`${row}|${col}`);
                  if (!cell || cell.total === 0) {
                    return (
                      <td key={col} className="p-1.5 text-center">
                        <div className="rounded-md h-10 flex items-center justify-center bg-muted/30 text-muted-foreground/30">
                          —
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={col} className="p-1.5 text-center">
                      <div
                        className="rounded-md h-10 flex flex-col items-center justify-center transition-transform hover:scale-105"
                        style={{ backgroundColor: getColor(cell.closeRate, cell.total) }}
                        title={`${formatLabel(row)} × ${formatLabel(col)}: ${cell.closeRate}% (${cell.closed}/${cell.total})`}
                      >
                        <span className="font-bold text-foreground">{cell.closeRate}%</span>
                        <span className="text-[9px] text-foreground/60">
                          {cell.closed}/{cell.total}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground">
        <span>Close rate:</span>
        <div className="flex items-center gap-0.5">
          <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: "rgba(220, 80, 60, 0.5)" }} />
          <span>0%</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: "rgba(220, 220, 100, 0.5)" }} />
          <span>50%</span>
        </div>
        <div className="flex items-center gap-0.5">
          <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: "rgba(80, 190, 70, 0.5)" }} />
          <span>100%</span>
        </div>
        <span className="ml-2">| Opacidad = cantidad de leads</span>
      </div>
    </div>
  );
}
