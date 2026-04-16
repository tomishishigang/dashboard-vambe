import { readFileSync, writeFileSync, existsSync } from "fs";
import type { ExtractionResult } from "../extraction/extract";

export interface LeadRow {
  id: number;
  hash: string;
  prompt_version: string;
  provider: string;
  model: string;
  nombre: string;
  correo: string;
  telefono: string;
  fecha_reunion: string;
  vendedor: string;
  closed: number;
  transcripcion: string;
  industria: string;
  tamano_empresa: string;
  caso_uso_primario: string;
  canal_descubrimiento: string;
  estacionalidad: string;
  integraciones_requeridas: string; // JSON array
  sector_regulado: number;
  preocupacion_principal: string;
  madurez_digital: string;
  volumen_mensual_estimado: number;
  confianza_extraccion: number;
  evidencia: string;
  created_at: string;
}

export class LeadRepository {
  private leads: LeadRow[];
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.leads = existsSync(filePath)
      ? JSON.parse(readFileSync(filePath, "utf-8"))
      : [];
  }

  insert(result: ExtractionResult): void {
    const id = this.leads.length > 0
      ? Math.max(...this.leads.map((l) => l.id)) + 1
      : 1;

    this.leads.push({
      id,
      hash: result.hash,
      prompt_version: result.promptVersion,
      provider: result.provider,
      model: result.model,
      nombre: result.raw.nombre,
      correo: result.raw.correo,
      telefono: result.raw.telefono,
      fecha_reunion: result.raw.fecha_reunion,
      vendedor: result.raw.vendedor,
      closed: result.raw.closed,
      transcripcion: result.raw.transcripcion,
      industria: result.extraction.industria,
      tamano_empresa: result.extraction.tamano_empresa,
      caso_uso_primario: result.extraction.caso_uso_primario,
      canal_descubrimiento: result.extraction.canal_descubrimiento,
      estacionalidad: result.extraction.estacionalidad,
      integraciones_requeridas: JSON.stringify(result.extraction.integraciones_requeridas),
      sector_regulado: result.extraction.sector_regulado ? 1 : 0,
      preocupacion_principal: result.extraction.preocupacion_principal,
      madurez_digital: result.extraction.madurez_digital,
      volumen_mensual_estimado: result.extraction.volumen_mensual_estimado,
      confianza_extraccion: result.extraction.confianza_extraccion,
      evidencia: result.extraction.evidencia,
      created_at: new Date().toISOString(),
    });

    this.save();
  }

  getExistingHashes(): Set<string> {
    return new Set(this.leads.map((l) => l.hash));
  }

  getAll(): LeadRow[] {
    return [...this.leads].sort((a, b) => a.fecha_reunion.localeCompare(b.fecha_reunion));
  }

  count(): number {
    return this.leads.length;
  }

  close(): void {
    // No-op — kept for interface compatibility
  }

  private save(): void {
    writeFileSync(this.filePath, JSON.stringify(this.leads, null, 2), "utf-8");
  }
}
