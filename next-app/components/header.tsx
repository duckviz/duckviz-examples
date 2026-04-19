"use client";

import { useState, useRef, useEffect } from "react";
import { useThemeContext } from "./theme-context";

export function Header() {
  const { preset, mode, setPreset, toggleMode, presets } = useThemeContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <header
      className="flex h-12 items-center justify-between border-b px-6"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div />

      <div className="flex items-center gap-3">
        {/* Mode toggle */}
        <button
          onClick={toggleMode}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
          style={{ color: "var(--muted)" }}
          title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
        >
          {mode === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Theme preset picker */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex h-8 items-center gap-2 rounded-md border px-3 text-xs transition-colors"
            style={{
              borderColor: "var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
            }}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: preset[mode]["--app-primary-default"] }}
            />
            <span className="capitalize">{preset.id}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {open && (
            <div
              className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border p-1 shadow-xl"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPreset(p); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-xs transition-colors"
                  style={{
                    background: preset.id === p.id ? "var(--surface-hover)" : "transparent",
                    color: preset.id === p.id ? "var(--foreground)" : "var(--muted)",
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-full ring-1"
                    style={{
                      background: p[mode]["--app-primary-default"],
                      "--tw-ring-color": "var(--border)",
                    } as React.CSSProperties}
                  />
                  <span className="capitalize">{p.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
