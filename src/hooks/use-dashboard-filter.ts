import { useState, useMemo } from "react";
import type { LeadRow } from "@/db";
import { calculateCloseRate } from "@/lib/analytics";

export type FilterKey =
  | "industria"
  | "vendedor"
  | "canal_descubrimiento"
  | "preocupacion_principal"
  | "tamano_empresa"
  | "caso_uso_primario";

export interface ActiveFilter {
  key: FilterKey;
  value: string;
}

export interface FilteredSummary {
  total: number;
  closed: number;
  closeRate: number;
}

/** Fields to search over when the user types a query */
const SEARCHABLE_FIELDS: (keyof LeadRow)[] = [
  "nombre",
  "correo",
  "vendedor",
  "industria",
  "canal_descubrimiento",
  "preocupacion_principal",
  "caso_uso_primario",
  "tamano_empresa",
  "transcripcion",
  "evidencia",
];

function matchesSearch(lead: LeadRow, query: string): boolean {
  const q = query.toLowerCase();
  return SEARCHABLE_FIELDS.some((field) =>
    String(lead[field]).toLowerCase().includes(q)
  );
}

export function useDashboardFilter(leads: LeadRow[]) {
  const [filter, setFilter] = useState<ActiveFilter | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);

  const filteredLeads = useMemo(() => {
    let result = leads;

    if (filter) {
      result = result.filter((l) => l[filter.key] === filter.value);
    }

    if (searchQuery.trim()) {
      result = result.filter((l) => matchesSearch(l, searchQuery.trim()));
    }

    return result;
  }, [leads, filter, searchQuery]);

  const filteredSummary: FilteredSummary = useMemo(() => {
    const closed = filteredLeads.filter((l) => l.closed === 1).length;
    return {
      total: filteredLeads.length,
      closed,
      closeRate: calculateCloseRate(closed, filteredLeads.length),
    };
  }, [filteredLeads]);

  const toggleFilter = (key: FilterKey, value: string) => {
    if (filter?.key === key && filter?.value === value) {
      setFilter(null);
    } else {
      setFilter({ key, value });
      setSelectedLead(null);
    }
  };

  const clearFilter = () => setFilter(null);

  const hasActiveFilters = filter !== null || searchQuery.trim() !== "";

  return {
    filter,
    searchQuery,
    setSearchQuery,
    filteredLeads,
    filteredSummary,
    selectedLead,
    setSelectedLead,
    toggleFilter,
    clearFilter,
    hasActiveFilters,
  };
}
