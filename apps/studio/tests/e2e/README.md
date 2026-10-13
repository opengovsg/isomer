# E2E Tests

Run from `apps/studio`:

```bash
pnpm test:e2e                              # all projects
pnpm exec playwright test --project=admin  # one role
```

## What goes where

| Doc                                                                                       | Purpose                                                                                       |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **This README**                                                                           | Run commands, import paths, directory layout, Playwright projects, where POs live             |
| [E2E conventions](../../../../.claude/skills/isomer-conventions/conventions/e2e-tests.md) | Rules and violation smells for reviews and agents (layers, `page.*` ban, DB polls, role tags) |

When you add a PO or fixture file, update code and `fixtures/po/index.ts` (or the entity barrel). You do **not** need to extend the conventions doc unless you introduce a new **rule** the suite should enforce.

## Fixtures

Import via the `~e2e/*` path alias (`apps/studio/tsconfig.json`). Use **subpath barrels** — there is no root `fixtures/index.ts`.

| Import path                  | Purpose                                       |
| ---------------------------- | --------------------------------------------- |
| `~e2e/fixtures/auth`         | `TEST_EMAILS`, `roleTag`, storage state paths |
| `~e2e/fixtures/helpers`      | Multi-step UI flows (wizards, invite)         |
| `~e2e/fixtures/login`        | `LoginPage` (smoke / singpass / login-flow)   |
| `~e2e/fixtures/session-mint` | Mint role `storageState` in global setup      |
| `~e2e/fixtures/network`      | Route stubs (S3 upload, GrowthBook)           |
| `~e2e/fixtures/reset`        | Site-scoped DB reset / cleanup helpers        |
| `~e2e/fixtures/po`           | Page objects (see below)                      |
| `~e2e/fixtures/collection`   | Collection seed / db helpers                  |
| `~e2e/fixtures/resource`     | Resource seed / db / expect                   |
| `~e2e/fixtures/site`         | Site provision, db queries, expect polls      |
| `~e2e/fixtures/user`         | User seed / db / expect / mutations           |
| `~e2e/fixtures/whitelist`    | Whitelist seed / db / expect                  |
| `~e2e/fixtures/role`         | Global role seeding (`seedRolesForE2E`)       |

```ts
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { DashboardPO } from "~e2e/fixtures/po"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
```

## Structure

- `fixtures/` — entity folders (`resource/`, `site/`, `user/`, …), `po/`, and cross-cutting files (`auth.ts`, `helpers.ts`, …).
- `storage-state/` — gitignored; `global-setup.ts` mints one session cookie jar per role the shard needs.
- `<module>/` — one directory per product area / CI shard (`site/`, `page/`, `resource/`, `collection/`, …). Each file covers a single UI surface (e.g. `site/settings-agency.test.ts`).

## Page objects

- Import: `~e2e/fixtures/po`
- Source: one class per file under `fixtures/po/`. **Canonical list:** `fixtures/po/index.ts` (add new POs there when you add a file).
- Tests construct POs and assert outcomes; they do not call Playwright `page.*` except as allowed in the [conventions doc](../../../../.claude/skills/isomer-conventions/conventions/e2e-tests.md).

## Role projects

Auth uses Playwright **projects**, not per-file `test.use({ storageState })`.

`roleTag("admin")` emits `@role:admin`. The `role:` prefix keeps role tags from colliding with any other `@…` tag.

| Project                                                        | How tests are selected                     | Auth                         |
| -------------------------------------------------------------- | ------------------------------------------ | ---------------------------- |
| `unauthenticated`                                              | `testMatch: /(smoke\|singpass)\.test\.ts/` | none                         |
| `login-flow`                                                   | `testMatch: /login-flow\.test\.ts/`        | none (full UI sign-in)       |
| `admin`, `editor`, `publisher`, `nomember`, `core`, `migrator` | `grep: /@role:<role>\b/`                   | `storageState` for that role |

`singpass.test.ts` is matched by `unauthenticated`. Every test in that file is `test.skip` — remove `.skip` locally to run against Mockpass.

Tag each role `describe` with `roleTag(...)` from `~e2e/fixtures/auth` (typed from `ROLES`). Do not use `test.use({ storageState })` or raw `"@role:admin"` strings — see conventions doc.

## Adding tests for a new module

1. Identify the router's `__tests__/<module>.router.test.ts` file.
2. For each `describe` block, identify the user-facing UI surface (settings page, dashboard view, modal, …).
3. Add e2e coverage for user-visible flows on that surface (UI actions, toasts, persisted state).
4. Add permission tests where the UI shows a signal (hidden control, redirect, disabled action) — not every surface needs a dedicated gate test if another file already covers that boundary.
5. Do **not** translate validation-error or audit-log scenarios — those stay in integration tests.
6. If you add a new `tests/e2e/<feature>/` directory, add a matching `paths:` entry in the e2e-tests CI matrix (see `scripts/e2eCiCoverage.test.ts`).

## Why storage-state, not per-test login

OTP + Mockpass adds several seconds per full UI login. Global setup mints one `storage-state/<role>.json` per role the shard needs (iron-session cookie, no browser). Role projects reuse those jars via project `storageState`. UI login coverage lives in `login-flow.test.ts`.

## Why we still keep integration tests

E2E covers user-visible behavior. Integration tests cover server-side correctness (audit logs, validation codes, side effects). Both layers are needed.

## Known footguns

- **`storage-state/` is gitignored but persists across local runs**. If you switch your local DB target away from the test DB, delete the cookie jars: `rm apps/studio/tests/e2e/storage-state/*.json`.

## Open follow-ups

- **`.chakra-switch` in `settings-notification.test.ts`.** Couples the test to Chakra class naming. Upstream fix: add an `aria-label` on the Switch in FormBuilder, then use `getByRole("switch", { name: ... })`.
