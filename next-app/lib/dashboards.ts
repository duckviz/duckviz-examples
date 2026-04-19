import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DIR = join(process.cwd(), "data", "dashboards");

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
