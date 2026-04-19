"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { ALL_PRESETS } from "@duckviz/ui";
import type { DuckvizThemePreset } from "@duckviz/ui";
import { github } from "@/lib/themes/github";

type Mode = "light" | "dark";

interface ThemeContextValue {
  preset: DuckvizThemePreset;
  mode: Mode;
  setPreset: (p: DuckvizThemePreset) => void;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  presets: readonly DuckvizThemePreset[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const PRESETS: readonly DuckvizThemePreset[] = [github, ...ALL_PRESETS];

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<DuckvizThemePreset>(github);
  const [mode, setMode] = useState<Mode>("light");
  const toggleMode = useCallback(
    () => setMode((m) => (m === "dark" ? "light" : "dark")),
    [],
  );

  return (
    <ThemeContext.Provider
      value={{
        preset,
        mode,
        setPreset,
        setMode,
        toggleMode,
        presets: PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeContext must be used inside ThemeContextProvider");
  return ctx;
}
