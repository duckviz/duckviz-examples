import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { DATASETS } from "@/lib/datasets/registry";

const DIR = join(process.cwd(), "data", "dashboards");

/**
 * Map a widget's DuckDB SQL back to the dataset slug it queries against.
 * Used to "promote" a dashboard from `datasetSlug: "all"` (created from the
 * home page where multiple datasets are mounted) to the concrete slug once
 * widgets land on it. Matches the first quoted `t_*` table name and looks
 * it up in the dataset registry.
 */
export function deriveSlugFromSql(sql: string): string | null {
  const match = sql.match(/"(t_[a-z0-9_]+)"/i);
  if (!match) return null;
  const tableName = match[1];
  return DATASETS.find((d) => d.tableName === tableName)?.slug ?? null;
}

function ensureDir() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  description: string;
  dataKey: string;
  config?: Record<string, unknown>;
  layout?: { x: number; y: number; w: number; h: number };
}

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  datasetSlug: string;
  widgets: DashboardWidget[];
  createdAt: string;
}

export function listDashboards(): DashboardConfig[] {
  ensureDir();
  const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
  return files
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(DIR, f), "utf-8")) as DashboardConfig;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as DashboardConfig[];
}

export function getDashboard(id: string): DashboardConfig | null {
  ensureDir();
  const path = join(DIR, `${id}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as DashboardConfig;
  } catch {
    return null;
  }
}

export function saveDashboard(config: DashboardConfig): void {
  ensureDir();
  writeFileSync(join(DIR, `${config.id}.json`), JSON.stringify(config, null, 2));
}

export function deleteDashboard(id: string): boolean {
  const path = join(DIR, `${id}.json`);
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}
