import { readFileSync } from "fs";
import Papa from "papaparse";
import type { RawLead } from "./schema";

/** Maps internal field names to CSV column headers */
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
    console.warn(`⚠️  CSV parse warnings (${errors.length}):`);
    errors.slice(0, 5).forEach((e) => console.warn(`   Row ${e.row}: ${e.message}`));
  }

  return data.map((row) => {
    const closedRaw = parseInt(row[CSV_COLUMNS.closed] ?? "0", 10);
    return {
      nombre: row[CSV_COLUMNS.nombre]?.trim() ?? "",
      correo: row[CSV_COLUMNS.correo]?.trim() ?? "",
      telefono: row[CSV_COLUMNS.telefono]?.trim() ?? "",
      fecha_reunion: row[CSV_COLUMNS.fecha_reunion]?.trim() ?? "",
      vendedor: row[CSV_COLUMNS.vendedor]?.trim() ?? "",
      closed: Number.isNaN(closedRaw) ? 0 : closedRaw,
      transcripcion: row[CSV_COLUMNS.transcripcion]?.trim() ?? "",
    };
  });
}
