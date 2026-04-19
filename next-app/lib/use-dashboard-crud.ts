"use client";

import { useCallback, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import type { AddWidgetResult } from "@duckviz/explorer";

interface DashboardRef {
  id: string;
  name: string;
}

/**
 * Manages dashboard CRUD for the explore page — loading the list,
 * creating new dashboards, and adding widgets.
 */
export function useDashboardCrud(datasetSlug: string) {
  const [dashboards, setDashboards] = useState<DashboardRef[]>([]);

  useEffect(() => {
    fetch("/api/dashboards")
      .then((r) => r.json())
      .then((d) =>
        setDashboards(
          d.map((db: DashboardRef) => ({ id: db.id, name: db.name })),
        ),
      )
      .catch(() => {});
  }, []);

  const createDashboard = useCallback(
    (name: string, description?: string): string => {
      const id = nanoid(10);
      setDashboards((prev) => [...prev, { id, name }]);
      fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, description, datasetSlug }),
      }).catch(() => {});
      return id;
    },
    [datasetSlug],
  );

  const addWidget = useCallback(
    (
      dashboardId: string,
      widget: {
        type: string;
        title: string;
        description: string;
        duckdbQuery: string;
        config?: Record<string, unknown>;
      },
    ): AddWidgetResult => {
      fetch(`/api/dashboards/${dashboardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widget }),
      }).catch(() => {});
      return { ok: true };
    },
    [],
  );

  return { dashboards, createDashboard, addWidget };
}
