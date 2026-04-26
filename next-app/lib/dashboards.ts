import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const DIR = join(process.cwd(), "data", "dashboards");

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
  if (!existsSync(DIR)) return [];
  const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
  const dashboards = files
    .map((f) => {
      try {
        return JSON.parse(
          readFileSync(join(DIR, f), "utf-8"),
        ) as DashboardConfig;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as DashboardConfig[];
  return dashboards.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function getDashboard(id: string): DashboardConfig | null {
  const path = join(DIR, `${id}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as DashboardConfig;
  } catch {
    return null;
  }
}
