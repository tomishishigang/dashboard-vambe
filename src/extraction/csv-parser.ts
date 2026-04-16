import { readFileSync } from "fs";
import Papa from "papaparse";
import type { RawLead } from "./schema";

/** Maps CSV header names to internal field names */
const CSV_COLUMNS = {
  nombre: "Nombre",
  correo: "Correo Electronico",
  telefono: "Numero de Telefono",
  fecha_reunion: "Fecha de la Reunion",
  vendedor: "Vendedor asignado",
  closed: "closed",
  transcripcion: "Transcripcion",
} as const;

export function parseLeadsCSV(path: string): RawLead[] {
  const raw = readFileSync(path, "utf-8");
  const { data, errors } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    console.warn(`⚠️  CSV parse warnings: ${errors.length} issues found`);
  }

  return data.map((row) => ({
    nombre: row[CSV_COLUMNS.nombre]?.trim() ?? "",
    correo: row[CSV_COLUMNS.correo]?.trim() ?? "",
    telefono: row[CSV_COLUMNS.telefono]?.trim() ?? "",
    fecha_reunion: row[CSV_COLUMNS.fecha_reunion]?.trim() ?? "",
    vendedor: row[CSV_COLUMNS.vendedor]?.trim() ?? "",
    closed: parseInt(row[CSV_COLUMNS.closed] ?? "0", 10),
    transcripcion: row[CSV_COLUMNS.transcripcion]?.trim() ?? "",
  }));
}
