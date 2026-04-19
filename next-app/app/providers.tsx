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
        <DuckvizDBProvider persistence arrowIngest batchSize={5000}>
          {children}
        </DuckvizDBProvider>
      </ThemeWrapper>
    </ThemeContextProvider>
  );
}
