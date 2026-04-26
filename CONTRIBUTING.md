# Contributing

Thanks for helping make DuckViz easier to adopt. This repo holds runnable examples, so contributions tend to be small and focused: a fixed bug, a clearer comment, a new framework example.

## Ways to contribute

- **File a bug.** Use the [bug report template](https://github.com/duckviz/duckviz-examples/issues/new/choose). Include the example name, what you ran, and what you expected.
- **Suggest an example.** Open a [feature request](https://github.com/duckviz/duckviz-examples/issues/new/choose) describing the framework or use case.
- **Send a fix.** Small fixes don't need a prior issue — open a PR directly.
- **Send a new example.** For larger contributions, open an issue first so we can align on scope before you build it.

## Development setup

```bash
git clone https://github.com/duckviz/duckviz-examples.git
cd duckviz-examples/next-app   # or whichever example you're touching
bun install
bun dev
```

Each example has its own README with stack-specific notes.

## Standards

- **TypeScript strict** — no `any`, no `@ts-ignore` without a comment explaining why.
- **No workspace links.** Examples must `git clone` and run with only published `@duckviz/*` packages from npm. If you need an unreleased feature, ship it to the registry first.
- **Mirror the existing structure.** Each example lives in its own top-level folder (`next-app`, `react-vite-app`, etc.) with its own `package.json` and README.
- **Comments explain WHY, not WHAT.** Code that's self-evident from the names doesn't need a comment. A workaround, a non-obvious constraint, or a subtle invariant does.

## Pull requests

1. Fork and create a topic branch.
2. Keep PRs focused — one example or one fix per PR.
3. Run `bunx tsc --noEmit` and `bun next build` (or the equivalent for your example) before submitting.
4. Fill out the PR template.

CI runs typecheck and build on every PR. We can't merge red PRs.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Questions?

For product questions, see <https://docs.duckviz.com>. For example-repo questions, open a [Discussion](https://github.com/duckviz/duckviz-examples/discussions).
