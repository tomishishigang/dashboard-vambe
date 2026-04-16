import { z } from "zod/v4";

export const IndustriaEnum = z.enum([
  "servicios_financieros",
  "retail_ecommerce",
  "salud",
  "tecnologia",
  "educacion",
  "logistica_transporte",
  "turismo_hoteleria",
  "gastronomia",
  "legal",
  "construccion_inmobiliaria",
  "marketing_publicidad",
  "produccion_audiovisual",
  "moda_textil",
  "servicios_profesionales",
]);

export const TamanoEmpresaEnum = z.enum([
  "startup",
  "pyme",
  "mediana",
]);

export const CasoUsoPrimarioEnum = z.enum([
  "soporte_tecnico",
  "atencion_general",
  "reservas_citas",
  "consultas_producto",
  "cotizaciones",
  "gestion_pedidos_envios",
]);

export const CanalDescubrimientoEnum = z.enum([
  "conferencia_feria",
  "webinar_seminario",
  "referido_colega",
  "busqueda_online",
  "contenido_digital",
  "evento_networking",
  "foro_comunidad",
]);

export const EstacionalidadEnum = z.enum([
  "constante",
  "picos_moderados",
  "muy_estacional",
]);

export const IntegracionEnum = z.enum([
  "crm",
  "sistema_tickets",
  "ecommerce",
  "sistema_citas",
  "base_datos_propia",
  "erp",
  "ninguna_mencionada",
]);

export const PreocupacionEnum = z.enum([
  "personalizacion",
  "integracion_sistemas",
  "confidencialidad_compliance",
  "escalabilidad_volumen",
  "calidad_precision_respuestas",
]);

export const MadurezDigitalEnum = z.enum(["alta", "media"]);

export const ExtraccionLeadSchema = z.object({
  industria: IndustriaEnum.describe(
    "Vertical o sector económico del cliente"
  ),
  tamano_empresa: TamanoEmpresaEnum.describe(
    "Tamaño inferido de la empresa del cliente"
  ),
  caso_uso_primario: CasoUsoPrimarioEnum.describe(
    "Caso de uso principal que el cliente busca resolver con Vambe"
  ),
  canal_descubrimiento: CanalDescubrimientoEnum.describe(
    "Cómo el cliente conoció Vambe"
  ),
  estacionalidad: EstacionalidadEnum.describe(
    "Si el volumen de consultas es constante o tiene picos estacionales"
  ),
  integraciones_requeridas: z
    .array(IntegracionEnum)
    .describe(
      "Integraciones mencionadas o inferidas que el cliente necesita"
    ),
  sector_regulado: z
    .boolean()
    .describe(
      "Si el sector requiere cumplimiento normativo especial (salud, legal, financiero)"
    ),
  preocupacion_principal: PreocupacionEnum.describe(
    "La preocupación o requerimiento más enfatizado por el cliente"
  ),
  madurez_digital: MadurezDigitalEnum.describe(
    "Nivel de madurez digital del cliente inferido de la transcripción"
  ),
  volumen_mensual_estimado: z
    .number()
    .int()
    .min(0)
    .describe(
      "Volumen mensual estimado de interacciones. Normalizar: si dice 'diario' multiplicar por 30, si dice 'semanal' por 4. Si no hay número, devolver 0."
    ),
  confianza_extraccion: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Confianza del modelo en la extracción (0.0 a 1.0). Menor cuando la información es ambigua o insuficiente"
    ),
  evidencia: z
    .string()
    .describe(
      "Frase textual de la transcripción que mejor justifica las categorías extraídas"
    ),
});

export type ExtraccionLead = z.infer<typeof ExtraccionLeadSchema>;

export const RawLeadSchema = z.object({
  nombre: z.string(),
  correo: z.string(),
  telefono: z.string(),
  fecha_reunion: z.string(),
  vendedor: z.string(),
  closed: z.number(),
  transcripcion: z.string(),
});

export type RawLead = z.infer<typeof RawLeadSchema>;
