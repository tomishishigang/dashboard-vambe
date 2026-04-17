import { resolve } from "path";

export const DATA_DIR = resolve(process.cwd(), "data");
export const DB_PATH = resolve(DATA_DIR, "leads.json");
export const CSV_PATH = resolve(DATA_DIR, "vambe_clients.csv");
export const INSIGHTS_PATH = resolve(DATA_DIR, "insights.json");
