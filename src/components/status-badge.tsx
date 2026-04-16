"use client";

import { Badge } from "@/components/ui/badge";

interface Props {
  closed: boolean;
  size?: "sm" | "default";
}

export function StatusBadge({ closed, size = "default" }: Props) {
  const sizeClass = size === "sm" ? "text-xs" : "";

  if (closed) {
    return (
      <Badge className={`bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 ${sizeClass}`}>
        {size === "sm" ? "Cerrado" : "Venta Cerrada"}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`text-muted-foreground ${sizeClass}`}>
      {size === "sm" ? "Abierto" : "No Cerrada"}
    </Badge>
  );
}
