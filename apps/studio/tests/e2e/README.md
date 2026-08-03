# E2E Tests

Run from `apps/studio`:

```bash
pnpm test:e2e                              # all projects
pnpm exec playwright test --project=admin  # one role
```

## Fixtures

Import via the `~e2e/*` path alias (`apps/studio/tsconfig.json`). Use **subpath barrels** — there is no root `fixtures/index.ts`.

| Import path               | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `~e2e/fixtures/auth`      | `TEST_EMAILS`, `roleTag`, storage state paths |
| `~e2e/fixtures/helpers`   | Multi-step UI flows (wizards, invite)         |
| `~e2e/fixtures/login`     | `LoginPage` (smoke / singpass)                |
| `~e2e/fixtures/network`   | Route stubs (S3 upload, GrowthBook)           |
| `~e2e/fixtures/reset`     | Site-scoped DB reset / cleanup helpers        |
| `~e2e/fixtures/po`        | Page objects (`DashboardPO`, `SitePO`, …)     |
| `~e2e/fixtures/resource`  | Resource seed / db / expect                   |
| `~e2e/fixtures/site`      | Site provision, db queries, expect polls      |
| `~e2e/fixtures/user`      | User seed / db / expect / mutations           |
| `~e2e/fixtures/whitelist` | Whitelist seed / db / expect                  |
| `~e2e/fixtures/role`      | Global role seeding (`seedRolesForE2E`)       |

```ts
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { DashboardPO } from "~e2e/fixtures/po"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
```

## Structure

- `fixtures/` — entity folders (`resource/`, `site/`, `user/`, …), `po/`, and cross-cutting files (`auth.ts`, `helpers.ts`, …).
- `storage-state/` — gitignored; populated by `global-setup.ts` with one signed-in cookie jar per role.
- `<module>/` — one directory per backend router module (`site/`, `page/`, `resource/`, …). Each file covers a single UI surface (e.g. `site/settings-agency.test.ts`).

Enforceable conventions (PO rules, DB layers, smells) live in `.claude/skills/isomer-conventions/conventions/e2e-tests.md`.

## Adding tests for a new module

1. Identify the router's `__tests__/<module>.router.test.ts` file.
2. For each `describe` block, identify the user-facing UI surface (settings page, dashboard view, modal, …).
3. Add e2e coverage for user-visible flows on that surface (UI actions, toasts, persisted state).
4. Add permission tests where the UI shows a signal (hidden control, redirect, disabled action) — not every surface needs a dedicated gate test if another file already covers that boundary.
5. Do **not** translate validation-error or audit-log scenarios — those stay in integration tests.

## Page objects

All Playwright `page.*` calls live in `fixtures/po/` or `fixtures/helpers.ts` — not in `*.test.ts`. Test files construct POs and assert outcomes. See conventions doc for the allowlist and detection command.

## Role projects

Auth uses Playwright **projects**, not per-file `test.use({ storageState })`.

| Project                                                        | How tests are selected                     | Auth                         |
| -------------------------------------------------------------- | ------------------------------------------ | ---------------------------- |
| `unauthenticated`                                              | `testMatch: /(smoke\|singpass)\.test\.ts/` | none                         |
| `admin`, `editor`, `publisher`, `nomember`, `core`, `migrator` | `grep: /@role\b/`                          | `storageState` for that role |

`singpass.test.ts` is matched by `unauthenticated`. Every test in that file is `test.skip` — remove `.skip` locally to run against Mockpass.

Tag each role `describe` with `roleTag(...)` from `~e2e/fixtures/auth` (typed from `ROLES`). Do not use `test.use({ storageState })` or raw `"@admin"` strings.

## Why storage-state, not per-test login

OTP + Mockpass adds ~4s per login. Global-setup signs in each role once at startup; role projects reuse cookies via project `storageState`.

## Why we still keep integration tests

E2E covers user-visible behavior. Integration tests cover server-side correctness (audit logs, validation codes, side effects). Both layers are needed.

## Known footguns

- **`storage-state/` is gitignored but persists across local runs**. If you switch your local DB target away from the test DB, delete the cookie jars: `rm apps/studio/tests/e2e/storage-state/*.json`.

## Open follow-ups

- **`.chakra-switch` in `settings-notification.test.ts`.** Couples the test to Chakra class naming. Upstream fix: add an `aria-label` on the Switch in FormBuilder, then use `getByRole("switch", { name: ... })`.
