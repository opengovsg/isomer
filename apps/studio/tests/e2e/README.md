# E2E Tests

## Structure

- `fixtures/` — reusable test infrastructure (login flow, page objects, role storage state).
- `storage-state/` — gitignored; populated by `global-setup.ts` with one signed-in cookie jar per role.
- `<module>/` — one directory per backend router module (`site/`, `page/`, `resource/`, …). Each file inside covers a single UI surface (e.g. `site/settings-agency.test.ts`).

## Adding tests for a new module

1. Identify the router's `__tests__/<module>.router.test.ts` file.
2. For each `describe` block, identify the user-facing UI surface (settings page, dashboard view, modal, …).
3. Write **one happy-path test per surface** (drive the UI, assert toast + persisted state).
4. Write **one permission-gate test per surface** for the most restrictive role boundary that has UI signal.
5. Do **not** translate validation-error or audit-log scenarios — those stay in integration tests.

## Why storage-state, not per-test login

OTP + Mockpass adds ~4s per login. Without storage state, a 10-test suite spends 40s on auth alone. Global-setup signs in each role once at startup; tests reuse cookies via `test.use({ storageState: storageStateFor("admin") })`.

## Why we still keep integration tests

E2E covers user-visible behavior. Integration tests cover server-side correctness: audit log shape, GTM ID validation, role-boundary 401/403/404 codes, SearchSG side effects. We need both layers. Translating every integration scenario to e2e would triple CI time without adding meaningful signal.
