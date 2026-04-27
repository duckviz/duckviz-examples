"use client";

import type { ReactNode } from "react";
import { DuckvizDBProvider } from "@duckviz/db";
import { DuckvizThemeProvider } from "@duckviz/ui";
import { ThemeContextProvider, useThemeContext } from "@/components/theme-context";

function ThemeWrapper({ children }: { children: ReactNode }) {
  const { preset, mode } = useThemeContext();
  return (
    <DuckvizThemeProvider preset={preset} mode={mode}>
      {children}
    </DuckvizThemeProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeContextProvider>
      <ThemeWrapper>
        {/* persistence: cache DuckDB tables in IndexedDB so a page refresh
            doesn't re-ingest from /api/datasets.
            arrowIngest: zero-copy ingest from Arrow buffers — lower memory
            and faster than JSON for large datasets.
            batchSize: rows per insert chunk; 5000 keeps browser memory steady. */}
        <DuckvizDBProvider persistence arrowIngest batchSize={5000}>
          {children}
        </DuckvizDBProvider>
      </ThemeWrapper>
    </ThemeContextProvider>
  );
}
