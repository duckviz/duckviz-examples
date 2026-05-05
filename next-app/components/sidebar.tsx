"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardEntry {
  id: string;
  name: string;
  datasetSlug: string;
}

const AVATAR_COLORS = [
  "#2563eb",
  "#9333ea",
  "#059669",
  "#d97706",
  "#e11d48",
  "#0891b2",
  "#4f46e5",
  "#db2777",
];

export function Sidebar() {
  const pathname = usePathname();
  const [dashboards, setDashboards] = useState<DashboardEntry[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/dashboards")
      .then((r) => r.json())
      .then((d) => setDashboards(d))
      .catch(() => {});
  }, [pathname]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-2 left-2 z-50 rounded-md p-2 md:hidden"
        style={{ background: "var(--surface)", color: "var(--muted)" }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </button>

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-56 flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo / brand */}
        <Link
          href="/"
          className="flex h-12 items-center gap-2 px-3"
          style={{ borderBottom: "1px solid var(--border)" }}
          title="DuckViz Example"
        >
          <span className="text-xl leading-none">🧩</span>
          <span
            className="truncate text-sm font-semibold"
            style={{
              color: "var(--foreground)",
              paddingLeft: mobileOpen ? "16px" : "0px",
            }}
          >
            Dashboards
          </span>
        </Link>

        {/* Dashboards */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {dashboards.length === 0 ? (
            <p className="px-3 text-xs" style={{ color: "var(--muted)" }}>
              No dashboards found in <code>data/dashboards/</code>.
            </p>
          ) : (
            <nav className="space-y-0.5 px-2">
              {dashboards.map((db, i) => {
                const active = pathname === `/dashboard/${db.id}`;
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <Link
                    key={db.id}
                    href={`/dashboard/${db.id}`}
                    title={db.name}
                    className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm transition-colors"
                    style={{
                      background: active
                        ? "var(--surface-hover)"
                        : "transparent",
                      color: active ? "var(--foreground)" : "var(--muted)",
                    }}
                  >
                    <span
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: color }}
                    >
                      {db.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{db.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Footer */}
        <a
          href="https://duckviz.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-0.5 px-3 py-3 text-xs transition-colors hover:opacity-80"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          <span style={{ color: "var(--foreground)" }}>Built with DuckViz</span>
          <span>Explore your data →</span>
        </a>
      </aside>
    </>
  );
}
