# oxlint-plugin-isomer

Custom [Oxlint](https://oxc.rs/docs/guide/usage/linter/js-plugins.html) rules for the Isomer monorepo.

Rules are authored with [`@oxlint/plugins`](https://www.npmjs.com/package/@oxlint/plugins) (`defineRule`, `eslintCompatPlugin`), tested with `RuleTester` from `oxlint/plugins-dev`, and loaded via `jsPlugins` in `@isomer/oxlint-config`. **ESLint is not used.**

Keep `@oxlint/plugins` on the **same version** as `oxlint` when upgrading.

## Rules

### `isomer/one-hook-per-file`

Any TypeScript file may export at most **one** custom React hook (identifiers matching `use[A-Z]…`).

## Development

```bash
pnpm --filter oxlint-plugin-isomer test
pnpm --filter oxlint-plugin-isomer typecheck
```
