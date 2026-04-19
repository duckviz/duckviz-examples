import { Faker, en, base } from "@faker-js/faker";

/**
 * Create a seeded Faker instance. Each generator gets its own instance so
 * concurrent API calls don't interleave `seed()` on a shared singleton.
 * `base` is listed as a fallback so locale-agnostic datasets (e.g.
 * `location.country_code`) resolve even though `en` omits them.
 */
export function createFaker(seed: number): Faker {
  const f = new Faker({ locale: [en, base] });
  f.seed(seed);
  return f;
}

/** Pad numeric id with a string prefix, e.g. id(f, "ORD", 42) → "ORD-00042". */
export function id(prefix: string, n: number, width = 5): string {
  return `${prefix}-${String(n).padStart(width, "0")}`;
}

/** ISO YYYY-MM-DD from a Faker-generated Date. */
export function isoDate(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

/**
 * Log-normal sample via Box-Muller. Revenue, AOV, trade size, session length —
 * real-world heavy-tailed metrics cluster near `median` with a long right tail.
 */
export function logNormal(f: Faker, median: number, sigma = 0.6): number {
  const u1 = Math.max(1e-9, f.number.float({ min: 0, max: 1 }));
  const u2 = f.number.float({ min: 0, max: 1 });
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return median * Math.exp(sigma * z);
}

/** Clamp helper — keeps derived metrics inside realistic bounds. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Round to N decimal places. */
export function round(n: number, digits = 2): number {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}
