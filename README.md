# DuckViz Examples

Reference implementations that show how to embed [DuckViz](https://duckviz.com) — the in-browser data exploration and dashboarding library — into your own apps.

Each example is a self-contained, runnable project. Clone, install, run.

## Examples

| Example                          | Stack                          | What it shows                                                                                       |
| -------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| [`next-app`](./next-app)         | Next.js 15 · Tailwind v4 · TS  | Read-only dashboard showcase. Loads dashboards from JSON, renders with `@duckviz/dashboard`.        |

More examples coming. Open an [issue](https://github.com/duckviz/duckviz-examples/issues) if you'd like one for a specific framework or use case.

## What is DuckViz?

DuckViz lets you explore CSVs, Parquet, and JSON in the browser — no SQL required, no data leaves the user's machine. It's powered by DuckDB-WASM under the hood.

- **Website** · <https://duckviz.com>
- **Product** · <https://app.duckviz.com>
- **Docs** · <https://docs.duckviz.com>

## Getting started

```bash
git clone https://github.com/duckviz/duckviz-examples.git
cd duckviz-examples/next-app
bun install
bun dev
```

Open <http://localhost:3000>.

> Each example may have its own setup steps — check its README first.

## Repository conventions

- **Bun** is the package manager. `npm` and `pnpm` work too if you prefer.
- **TypeScript strict mode** everywhere.
- Examples pin DuckViz packages to published `^semver` versions (no workspace links). They run unmodified after `git clone`.

## Contributing

Bug reports, fixes, and new examples are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

If you've found a security issue, please follow the disclosure process in [SECURITY.md](./SECURITY.md). Do not open a public issue.

## License

[MIT](./LICENSE) © DuckViz
