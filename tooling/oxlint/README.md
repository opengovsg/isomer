# @isomer/oxlint-config

Shared **Oxlint** configuration for Isomer. This package **depends on** `oxlint` and `oxlint-tsgolint`. Workspaces that run lint only need `@isomer/oxlint-config` for those CLIs.

Workspaces whose `oxlint.config.ts` uses **`jsPlugins`: `eslint-plugin-storybook`** (for `storybook/*` rules) should list **`eslint-plugin-storybook`** in their own `devDependencies`—Oxlint loads that package via [JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins); **ESLint itself is not required**.

## Use in this monorepo

Add the config package to any workspace that runs lint:

```json
"devDependencies": {
  "@isomer/oxlint-config": "*"
}
```

Lint scripts should invoke the hoisted CLI (same as with ESLint):

```json
"scripts": {
  "lint": "oxlint --type-aware .",
  "lint:fix": "oxlint --type-aware --fix ."
}
```

`oxlint` is provided transitively via this package and appears under the root `node_modules/.bin` after `pnpm install`.

## Extend shared presets in `oxlint.config.ts`

In TypeScript configs, import shared presets and pass them to `extends`:

```ts
import { defineConfig } from "oxlint";
import base from "@isomer/oxlint-config/base";

export default defineConfig({
  extends: [base],
  ignorePatterns: [".next/**"],
  overrides: [],
});
```

Add package-specific `ignorePatterns` and `overrides` only—**`base.ts`** already sets `options.typeAware`, env, default ignores (`dist`, `**/*.config.*`), and the shared JS/TS/test rule blocks.

### Other repositories

1. Add the dependency (publish `@isomer/oxlint-config` or use `file:` / git / workspace protocol).
2. In `oxlint.config.ts`, import `base` as above, then add app-specific `ignorePatterns`, `overrides`, and `rules`.

Type-aware linting requires `oxlint-tsgolint` (already a dependency of this package). Run:

```bash
oxlint --type-aware
```

Or set `"options": { "typeAware": true }` in the root Oxlint config only.

## Exports

| Subpath | File |
|--------|------|
| `@isomer/oxlint-config/base` | `base.ts` |

Add more JSON presets under `tooling/oxlint/` and list them under `exports` in `package.json` as you split shared vs app-specific rules.
