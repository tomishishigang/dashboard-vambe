import { readFileSync, writeFileSync, existsSync } from "fs";

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
  integraciones_requeridas: string; // JSON-encoded string array, parsed with parseIntegrations()
  sector_regulado: number;
  preocupacion_principal: string;
  madurez_digital: string;
  volumen_mensual_estimado: number;
  confianza_extraccion: number;
  evidencia: string;
  created_at: string;
}

/** Shape expected by LeadRepository.insert() — decoupled from extraction layer */
export interface InsertableResult {
  raw: {
    nombre: string;
    correo: string;
    telefono: string;
    fecha_reunion: string;
    vendedor: string;
    closed: number;
    transcripcion: string;
  };
  extraction: {
    industria: string;
    tamano_empresa: string;
    caso_uso_primario: string;
    canal_descubrimiento: string;
    estacionalidad: string;
    integraciones_requeridas: string[];
    sector_regulado: boolean;
    preocupacion_principal: string;
    madurez_digital: string;
    volumen_mensual_estimado: number;
    confianza_extraccion: number;
    evidencia: string;
  };
  hash: string;
  promptVersion: string;
  model: string;
  provider: string;
}

export class LeadRepository {
  private leads: LeadRow[];
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    if (existsSync(filePath)) {
      try {
        this.leads = JSON.parse(readFileSync(filePath, "utf-8"));
      } catch (err) {
        console.error(`⚠️ Failed to parse ${filePath}, starting with empty data:`, err instanceof Error ? err.message : err);
        this.leads = [];
      }
    } else {
      this.leads = [];
    }
  }

  insert(result: InsertableResult): void {
    const lastId = this.leads.reduce((max, l) => Math.max(max, l.id), 0);
    const id = lastId + 1;

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
    try {
      writeFileSync(this.filePath, JSON.stringify(this.leads, null, 2), "utf-8");
    } catch (err) {
      throw new Error(`Failed to write ${this.filePath}: ${err instanceof Error ? err.message : err}`);
    }
  }
}
