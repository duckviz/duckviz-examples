"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
      <div
        className={`flex flex-1 flex-col min-w-0 transition-[margin] duration-200 ${
          expanded ? "md:ml-56" : "md:ml-14"
        }`}
      >
        <Header />
        <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
