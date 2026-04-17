import { readFileSync, existsSync } from "fs";
import { LeadRepository, type LeadRow } from "@/db";
import { buildDashboardData, type DashboardData } from "@/lib/analytics";
import { DB_PATH } from "@/config/paths";

const INSIGHTS_PATH = DB_PATH.replace("leads.json", "insights.json");

export interface Insight {
  titulo: string;
  descripcion: string;
  categoria: string;
}

export interface InsightsData {
  insights: Insight[];
  generatedAt: string;
  model: string;
  provider: string;
}

export interface DashboardPayload {
  leads: LeadRow[];
  dashboard: DashboardData;
  aiInsights?: InsightsData;
}

function loadInsights(): InsightsData | undefined {
  if (!existsSync(INSIGHTS_PATH)) return undefined;
  try {
    return JSON.parse(readFileSync(INSIGHTS_PATH, "utf-8"));
  } catch {
    console.error(`⚠️ Failed to parse ${INSIGHTS_PATH}, skipping insights`);
    return undefined;
  }
}

export function getDashboardData(): DashboardPayload {
  const repo = new LeadRepository(DB_PATH);
  try {
    const leads = repo.getAll();
    const dashboard = buildDashboardData(leads);
    const aiInsights = loadInsights();
    return { leads, dashboard, aiInsights };
  } finally {
    repo.close();
  }
}
