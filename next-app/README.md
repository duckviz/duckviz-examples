# DuckViz Next.js example

A read-only dashboard app built with Next.js 15 and [`@duckviz/dashboard`](https://docs.duckviz.com/packages/dashboard). Loads dashboard configs from JSON, generates realistic data with Faker, and renders the result in the browser via DuckDB-WASM.

Use this as a starting point for embedding DuckViz dashboards in your own Next.js app, or as a reference for the JSON-driven dashboard pattern.

> Screenshot to be added.

## Run it

```bash
git clone https://github.com/duckviz/duckviz-examples.git
cd duckviz-examples/next-app
bun install
bun dev
```

Open <http://localhost:3000>. The home page redirects to the first dashboard in `data/dashboards/`.

**No environment variables are required.** The example runs end-to-end on faker-generated data — there's no external service to authenticate against.

## What you're looking at

Three pieces fit together:

1. **Datasets** — Faker generators in [`lib/datasets/<slug>.ts`](lib/datasets/), registered in [`lib/datasets/registry.ts`](lib/datasets/registry.ts) with metadata (slug, table name, row count, industry). 14 datasets ship out of the box: HR employees, IoT sensors, real-estate listings, SaaS metrics, weather observations, banking transactions, manufacturing defects, airline flights, and more.
2. **Dashboards** — JSON configs in [`data/dashboards/<id>.json`](data/dashboards/). Each names a primary `datasetSlug` and lists widgets (chart type, title, SQL `dataKey`, layout).
3. **Glue** — the [`useDashboardWithData`](lib/use-dashboard-data.ts) hook fetches the dashboard config, scans every widget's SQL for `"t_*"` table references, fetches all referenced datasets in parallel, and hands them to `<Dashboard>` as the `datasets` prop. Cross-dataset dashboards work: a single SQL query can join two `t_*` tables.

> **Why pre-fetch into arrays instead of using an async loader?** `<Dashboard>` (and `<Report>`, `<Deck>`) don't pass an `activeId`, so the underlying `useAutoIngest` would silently skip loader-style datasets and widgets would fail with "DuckDB not initialized." Async loaders work for `<Explorer>`. Dashboards need rows up front.

## Project layout

```
next-app/
├── app/
│   ├── api/
│   │   ├── dashboards/route.ts         # GET list of dashboards
│   │   ├── dashboards/[id]/route.ts    # GET one dashboard config
│   │   └── datasets/[slug]/route.ts    # GET rows from a generator
│   ├── dashboard/[id]/                 # dashboard view
│   ├── page.tsx                        # redirects to first dashboard
│   ├── providers.tsx                   # theme + React context
│   └── globals.css
├── components/                         # app shell, header, sidebar, theming
├── data/
│   └── dashboards/*.json               # dashboard configs
├── lib/
│   ├── datasets/
│   │   ├── registry.ts                 # DATASETS array + GENERATORS map
│   │   ├── faker-utils.ts              # createFaker, logNormal, clamp, round
│   │   └── <slug>.ts                   # one file per generator
│   ├── dashboards.ts                   # filesystem loader for JSON configs
│   └── use-dashboard-data.ts           # hook: dashboard + its datasets
└── next.config.js                      # pptxgenjs ESM/node: fallbacks
```

## Add a new dataset

The 14 existing generators all follow the same shape. [`real-estate.ts`](lib/datasets/real-estate.ts) is the most thorough example — it shows how to anchor data to realistic constraints (metro-median pricing, mortgage math, regional tax rates) instead of letting Faker scatter values.

**1. Create the generator** at `lib/datasets/<slug>.ts`:

```ts
import { createFaker, logNormal, clamp, round } from "./faker-utils";

export function generateMyData(count = 500) {
  const f = createFaker(7007); // seed → reproducible rows
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      id: f.string.uuid(),
      amount: round(logNormal(f, 100, 0.6), 2),
      category: f.helpers.weightedArrayElement([
        { weight: 60, value: "common" },
        { weight: 30, value: "rare" },
        { weight: 10, value: "edge" },
      ]),
    });
  }
  return rows;
}
```

Use `createFaker(seed)` rather than Faker's global `seed()` — each generator gets its own instance so concurrent API calls don't interleave seeds. Use `logNormal()` for revenue, AOV, view counts, session length — anything with a long tail. `clamp()` keeps derived metrics inside realistic bounds.

**2. Register it** in [`lib/datasets/registry.ts`](lib/datasets/registry.ts):

```ts
import { generateMyData } from "./my-data";

export const DATASETS: DatasetMeta[] = [
  // ...existing entries
  {
    slug: "my-data",
    name: "My Data",
    icon: "📊",
    description: "What this dataset shows",
    tableName: "t_my_data",
    rowCount: 500,
    industry: "Whatever",
  },
];

const GENERATORS: Record<string, GeneratorFn> = {
  // ...
  "my-data": generateMyData,
};
```

The `tableName` must start with `t_`. That's the convention `useDashboardWithData` uses to spot table references in widget SQL.

**3. Verify** by hitting `http://localhost:3000/api/datasets/my-data` — you should get a JSON array of rows.

## Add a new dashboard

Drop a JSON file into [`data/dashboards/`](data/dashboards/). The filename (minus `.json`) becomes the dashboard id.

```json
{
  "id": "05-my-dashboard",
  "name": "My Dashboard",
  "datasetSlug": "my-data",
  "widgets": [
    {
      "id": "w1",
      "type": "big-number",
      "title": "Total Amount",
      "description": "",
      "dataKey": "SELECT 'Total' AS label, SUM(\"amount\") AS value FROM \"t_my_data\"",
      "config": {},
      "layout": { "x": 0, "y": 0, "w": 4, "h": 6 }
    }
  ],
  "createdAt": "2026-04-27T00:00:00.000Z"
}
```

Reload the home page — the dashboard appears in the sidebar.

**Widget types** include `big-number`, `bar`, `horizontal-bar`, `stacked-bar`, `area`, `line`, `geo-map`, `radar`, `dumbbell`, and many more. See the [DuckViz chart reference](https://docs.duckviz.com/reference/charts) for the full list and per-type config.

**SQL conventions:** quote identifiers (DuckDB is case-sensitive when quoted), cast aggregates explicitly when a chart expects numeric values (`CAST(COUNT(*) AS DOUBLE)`), and reference tables as `"t_<slug>"`.

**Cross-dataset dashboards:** any widget can reference multiple `t_*` tables in a single query — `useDashboardWithData` will detect and fetch all of them. [`04-real-estate.json`](data/dashboards/04-real-estate.json) is a worked example using one dataset across 8 widget types; the same pattern extends to joins across datasets.

## Custom themes

The example ships with a GitHub-style theme alongside the 10 built-in DuckViz presets. The picker in the header lets users switch between them.

[`lib/themes/github.ts`](lib/themes/github.ts) is a `DuckvizThemePreset` — light and dark variants of CSS custom properties (`--app-primary-default`, `--app-surface`, etc.). To add your own theme, copy that file, change the colors, and prepend it to the `PRESETS` array in [`components/theme-context.tsx`](components/theme-context.tsx):

```ts
import { myBrand } from "@/lib/themes/my-brand";

const PRESETS: readonly DuckvizThemePreset[] = [myBrand, github, ...ALL_PRESETS];
```

See the [`@duckviz/ui` theme reference](https://docs.duckviz.com/packages/ui) for the full token list.

## Going from faker to real data

The contract `<Dashboard>` expects doesn't change when you swap faker for a real source: an array of `{ name, data, tableName }` objects, each with `data` already loaded as rows. Replace the body of [`app/api/datasets/[slug]/route.ts`](app/api/datasets/[slug]/route.ts) with whatever loads your data — a database query, a file read, an upstream API call, a Parquet load via the SDK.

For server-side ingestion of larger datasets (Parquet, CSV from S3, remote databases), see [`@duckviz/sdk`](https://docs.duckviz.com/sdk). The SDK runs server-side; this example deliberately stays minimal and avoids it.

## Troubleshooting

- **"DuckDB not initialized" or a widget shows the error state.** Almost always means a `t_*` table referenced in widget SQL wasn't fetched. Check the network tab for `/api/datasets/<slug>` calls — every `t_*` name in your SQL must map to a `tableName` entry in `registry.ts`.
- **`/api/datasets/<slug>` returns 404.** The slug isn't in `GENERATORS` in `registry.ts`. Verify the import line.
- **`pptxgenjs` build errors about `node:fs` or `node:https`.** [`next.config.js`](next.config.js) strips the `node:` scheme and stubs those modules for the client bundle. If you're hitting this, your Next.js version may apply webpack overrides differently — open an issue with the version and the error.
- **Type errors after upgrading a `@duckviz/*` package.** Run `bunx tsc --noEmit` for the full diagnostic. We pin to `^semver` from npm, so a new minor may bring breaking type changes during the pre-1.0 phase.

## License

[MIT](../LICENSE) © DuckViz
