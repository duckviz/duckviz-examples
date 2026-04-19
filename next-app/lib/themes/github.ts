import type { DuckvizThemePreset } from "@duckviz/ui";

/**
 * GitHub-like theme — based on GitHub's Primer design tokens.
 * Cool-neutral surfaces, `#0969da` blue accent (light) / `#2f81f7` (dark).
 * Values written explicitly (not via `buildThemeTokens`) so the dark
 * surfaces stay the authentic GitHub near-black (`#0d1117` / `#161b22`),
 * which the derivation helper would warm slightly.
 */
export const github: DuckvizThemePreset = {
  id: "github",
  name: "GitHub",
  light: {
    "--app-background-default": "#ffffff",
    "--app-background-secondary": "#f6f8fa",
    "--app-background-tertiary": "#eaeef2",

    "--app-surface-subtle": "#f6f8fa",
    "--app-surface-subtle-hover": "#eaeef2",
    "--app-surface-subtle-selected": "#d0d7de",
    "--app-surface-default": "#ffffff",
    "--app-surface-default-hover": "#f6f8fa",
    "--app-surface-default-selected": "#eaeef2",
    "--app-surface-secondary": "#f6f8fa",
    "--app-surface-secondary-hover": "#eaeef2",
    "--app-surface-secondary-selected": "#d0d7de",
    "--app-surface-tertiary": "#eaeef2",
    "--app-surface-tertiary-hover": "#d8dee4",
    "--app-surface-tertiary-selected": "#d0d7de",

    "--app-text-default": "#1f2328",
    "--app-text-secondary": "#656d76",
    "--app-text-subtle": "#8c959f",

    "--app-border-default": "#d0d7de",
    "--app-border-secondary": "#d8dee4",
    "--app-border-subtle": "#eaeef2",

    "--app-primary-default": "#0969da",
    "--app-primary-secondary": "#218bff",
    "--app-primary-background": "#ddf4ff",
    "--app-primary-surface": "#ddf4ff",
    "--app-primary-surface-hover": "#b6e3ff",
    "--app-primary-surface-selected": "#80ccff",
    "--app-primary-text": "#0969da",
    "--app-primary-text-hover": "#0550ae",

    "--app-success-default": "#1a7f37",
    "--app-success-subtle": "#dafbe1",
    "--app-danger-default": "#cf222e",
    "--app-danger-subtle": "#ffebe9",
    "--app-warning-default": "#9a6700",
    "--app-info-default": "#0969da",
    "--app-info-subtle": "#ddf4ff",

    "--app-font-family-mono":
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    "--app-font-size-xs": "11px",
    "--app-font-size-sm": "13px",
    "--app-font-size-md": "14px",

    "--app-radius-xs": "3px",
    "--app-radius-sm": "6px",
    "--app-radius-md": "8px",
    "--app-radius-lg": "12px",

    "--app-color-1": "#0969da",
    "--app-color-2": "#1a7f37",
    "--app-color-3": "#8250df",
    "--app-color-4": "#bf8700",
    "--app-color-5": "#cf222e",
    "--app-color-6": "#bc4c00",
    "--app-color-7": "#116329",
    "--app-color-8": "#6639ba",
    "--app-color-9": "#9a6700",
    "--app-color-10": "#a40e26",
  },
  dark: {
    "--app-background-default": "#0d1117",
    "--app-background-secondary": "#161b22",
    "--app-background-tertiary": "#21262d",

    "--app-surface-subtle": "#161b22",
    "--app-surface-subtle-hover": "#21262d",
    "--app-surface-subtle-selected": "#30363d",
    "--app-surface-default": "#161b22",
    "--app-surface-default-hover": "#21262d",
    "--app-surface-default-selected": "#30363d",
    "--app-surface-secondary": "#161b22",
    "--app-surface-secondary-hover": "#21262d",
    "--app-surface-secondary-selected": "#30363d",
    "--app-surface-tertiary": "#21262d",
    "--app-surface-tertiary-hover": "#30363d",
    "--app-surface-tertiary-selected": "#424a53",

    "--app-text-default": "#e6edf3",
    "--app-text-secondary": "#7d8590",
    "--app-text-subtle": "#6e7681",

    "--app-border-default": "#30363d",
    "--app-border-secondary": "#21262d",
    "--app-border-subtle": "#21262d",

    "--app-primary-default": "#2f81f7",
    "--app-primary-secondary": "#58a6ff",
    "--app-primary-background": "#0c2d6b",
    "--app-primary-surface": "#0c2d6b",
    "--app-primary-surface-hover": "#1158c7",
    "--app-primary-surface-selected": "#1f6feb",
    "--app-primary-text": "#58a6ff",
    "--app-primary-text-hover": "#79c0ff",

    "--app-success-default": "#3fb950",
    "--app-success-subtle": "#0f2d18",
    "--app-danger-default": "#f85149",
    "--app-danger-subtle": "#2d0f12",
    "--app-warning-default": "#d29922",
    "--app-info-default": "#58a6ff",
    "--app-info-subtle": "#0c2d6b",

    "--app-font-family-mono":
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    "--app-font-size-xs": "11px",
    "--app-font-size-sm": "13px",
    "--app-font-size-md": "14px",

    "--app-radius-xs": "3px",
    "--app-radius-sm": "6px",
    "--app-radius-md": "8px",
    "--app-radius-lg": "12px",

    "--app-color-1": "#58a6ff",
    "--app-color-2": "#3fb950",
    "--app-color-3": "#a371f7",
    "--app-color-4": "#d29922",
    "--app-color-5": "#f85149",
    "--app-color-6": "#db6d28",
    "--app-color-7": "#56d364",
    "--app-color-8": "#bc8cff",
    "--app-color-9": "#e3b341",
    "--app-color-10": "#ff7b72",
  },
};
