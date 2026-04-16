import { LeadRepository, type LeadRow } from "@/db";
import { buildDashboardData, type DashboardData } from "@/lib/analytics";
import { DB_PATH } from "@/config/paths";

export interface DashboardPayload {
  leads: LeadRow[];
  dashboard: DashboardData;
}

export function getDashboardData(): DashboardPayload {
  const repo = new LeadRepository(DB_PATH);
  try {
    const leads = repo.getAll();
    const dashboard = buildDashboardData(leads);
    return { leads, dashboard };
  } finally {
    repo.close();
  }
}
