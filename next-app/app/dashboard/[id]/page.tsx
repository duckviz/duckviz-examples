"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Dashboard } from "@duckviz/dashboard";
import type { DashboardConfig as PkgDashboardConfig } from "@duckviz/dashboard";
import { useDashboardWithData } from "@/lib/use-dashboard-data";
import { Loading } from "@/components/loading";

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";
type Layouts = Array<{ id: string; x: number; y: number; w: number; h: number }>;

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { dashboard, error, ready, datasets } = useDashboardWithData(id);

  // Debounce layout PATCH — onLayoutChange fires continuously during a drag.
  // We hold the *latest* layout payload in a ref so the unmount cleanup can
  // flush it synchronously instead of dropping the pending save (the prior
  // implementation just `clearTimeout`-ed, which silently lost any change
  // made within 400 ms of clicking "Generate Report" / closing the tab).
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<Layouts | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback(
    (mode: "fetch" | "beacon" = "fetch") => {
      const payload = pendingPayloadRef.current;
      if (!payload) return;
      pendingPayloadRef.current = null;
      if (layoutTimerRef.current) {
        clearTimeout(layoutTimerRef.current);
        layoutTimerRef.current = null;
      }
      const body = JSON.stringify({ layouts: payload });
      // sendBeacon for the unmount/unload path — survives page navigation.
      // Regular fetch otherwise so we can show success/error feedback.
      if (mode === "beacon" && typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        // sendBeacon only does POST, so we tunnel via a dedicated path the
        // API route also accepts. Fall back to keepalive fetch if the route
        // isn't beacon-aware.
        const ok = navigator.sendBeacon(`/api/dashboards/${id}?_method=PATCH`, blob);
        if (!ok) {
          fetch(`/api/dashboards/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
          }).catch(() => {});
        }
        return;
      }
      setSaveStatus("saving");
      fetch(`/api/dashboards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body,
      })
        .then((r) => {
          if (!r.ok) throw new Error(`PATCH ${r.status}`);
          setSaveStatus("saved");
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
          savedTimerRef.current = setTimeout(() => setSaveStatus("idle"), 1500);
        })
        .catch((err) => {
          console.error("[duckviz:dashboard] layout save failed:", err);
          setSaveStatus("error");
        });
    },
    [id],
  );

  // Flush on unmount + page-hide so an in-flight drag isn't silently lost
  // when the user clicks "Generate Report" or closes the tab.
  useEffect(() => {
    const onPageHide = () => flushSave("beacon");
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      flushSave("beacon");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [flushSave]);

  const handleLayoutChange = useCallback(
    (layouts: Layouts) => {
      pendingPayloadRef.current = layouts;
      setSaveStatus("pending");
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
      layoutTimerRef.current = setTimeout(() => flushSave("fetch"), 400);
    },
    [flushSave],
  );

  const handleWidgetError = useCallback(
    (widgetId: string, message: string) => {
      console.error(`[duckviz:dashboard] widget ${widgetId} failed: ${message}`);
    },
    [],
  );

  // Fires once all widgets have settled — good hook for telemetry,
  // print automation, or hiding a full-dashboard loader overlay.
  const handleReady = useCallback(() => {
    console.info(`[duckviz:dashboard] ${id} ready (all widgets settled)`);
  }, [id]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2" style={{ color: "var(--muted)" }}>{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm"
            style={{ color: "var(--primary)" }}
          >
            ← Back to datasets
          </button>
        </div>
      </div>
    );
  }

  if (!ready) return <Loading message="Loading dashboard..." />;

  if (dashboard!.widgets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-1 text-lg" style={{ color: "var(--foreground)" }}>{dashboard!.name}</p>
          <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
            No widgets yet. Go back to the explorer and add some.
          </p>
          <button
            onClick={() => router.push(`/explore/${dashboard!.datasetSlug}`)}
            className="rounded-md px-4 py-2 text-sm text-white"
            style={{ background: "var(--primary)" }}
          >
            Open Explorer
          </button>
        </div>
      </div>
    );
  }

  const config: PkgDashboardConfig = {
    name: dashboard!.name,
    widgets: dashboard!.widgets.map((w) => ({
      id: w.id,
      type: w.type,
      title: w.title,
      description: w.description,
      dataKey: w.dataKey,
      config: w.config,
      layout: w.layout,
    })),
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{dashboard!.name}</h1>
          <p className="text-xs flex items-center gap-2" style={{ color: "var(--muted)" }}>
            <span>
              {dashboard!.widgets.length} widget{dashboard!.widgets.length !== 1 ? "s" : ""} · {dashboard!.datasetSlug}
            </span>
            <SaveBadge status={saveStatus} />
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/report/${id}`)}
            className="rounded-md px-3 py-1.5 text-xs"
            style={{ background: "var(--surface-hover)", color: "var(--foreground)" }}
          >
            Generate Report
          </button>
          <button
            onClick={() => router.push(`/deck/${id}`)}
            className="rounded-md px-3 py-1.5 text-xs"
            style={{ background: "var(--surface-hover)", color: "var(--foreground)" }}
          >
            Create Deck
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Dashboard
          config={config}
          datasets={datasets}
          dropTablesOnUnmount={true}
          onLayoutChange={handleLayoutChange}
          onWidgetError={handleWidgetError}
          onReady={handleReady}
        />
      </div>
    </div>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const map: Record<Exclude<SaveStatus, "idle">, { text: string; color: string }> = {
    pending: { text: "Editing…", color: "var(--muted)" },
    saving: { text: "Saving…", color: "var(--muted)" },
    saved: { text: "Saved ✓", color: "var(--primary)" },
    error: { text: "Save failed", color: "#dc2626" },
  };
  const { text, color } = map[status];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "1px 8px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        color,
      }}
    >
      {text}
    </span>
  );
}
