---
title: Reference catalog packages via "catalog:" not direct version strings
category: Dependencies
type: smell
---

## Pattern

Any package declared in `pnpm-workspace.yaml` under `catalog:` or `catalogs:`
must be referenced in `package.json` files using `"catalog:"`,
`"catalog:XXX"`, or `"workspace:*"` — never a direct version string.

## Why

Direct version strings (`"^1.0.0"`) in individual `package.json` files bypass
the single-source-of-truth in `pnpm-workspace.yaml`, allowing version drift
between packages in the monorepo. When the catalog version is bumped, files
with pinned versions silently diverge, causing hard-to-diagnose mismatches.

## Bad

```json
// apps/studio/package.json
{
  "dependencies": {
    "zod": "^4.0.0",
    "react": "^18.3.1"
  }
}
```

Both `zod` and `react` are defined in `pnpm-workspace.yaml` — the version
should not be duplicated in `package.json`.

## Good

```json
// apps/studio/package.json
{
  "dependencies": {
    "zod": "catalog:",
    "react": "catalog:react",
    "@isomer/some-internal-pkg": "workspace:*"
  }
}
```

## How to detect

1. Extract all package names from `catalog:` and every `catalogs:` entry in
   `pnpm-workspace.yaml`.
2. Search all `package.json` files (excluding `node_modules`) for dependency
   values that are plain version strings (start with a digit, `^`, `~`, or are
   a range) for packages in that set.

```bash
find . -name "package.json" -not -path "*/node_modules/*"
```

Then inspect `dependencies`, `devDependencies`, `peerDependencies`, and
`optionalDependencies` in each file.
