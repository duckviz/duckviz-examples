"use client";

import { useCallback, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import type { AddWidgetResult } from "@duckviz/explorer";

interface DashboardRef {
  id: string;
  name: string;
}

interface SaveWidgetInput {
  type: string;
  title: string;
  description?: string;
  duckdbQuery?: string;
  config?: Record<string, unknown>;
  layout?: { x: number; y: number; w: number; h: number };
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

  // Batch save for the AI builder. One POST creates the dashboard and inserts
  // every widget atomically — matches Explorer 0.17.0's `onSaveDashboardWithWidgets`
  // contract, which collapses the previous N+1 round-trips (1 create + N
  // per-widget PATCHes) into a single request.
  const saveDashboardWithWidgets = useCallback(
    (payload: {
      name: string;
      description?: string;
      widgets: SaveWidgetInput[];
    }): string => {
      const id = nanoid(10);
      setDashboards((prev) => [...prev, { id, name: payload.name }]);
      fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: payload.name,
          description: payload.description,
          datasetSlug,
          widgets: payload.widgets,
        }),
      }).catch(() => {});
      return id;
    },
    [datasetSlug],
  );

  return { dashboards, createDashboard, addWidget, saveDashboardWithWidgets };
}
