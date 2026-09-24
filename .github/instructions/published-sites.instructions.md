---
applyTo: "packages/components/src/**/*,tooling/template/**/*"
---

# Published-site compatibility review instructions

- Treat stored site JSON and already-published content as historical inputs
  that must continue to render. Schema and interface additions must be
  optional. Do not remove a field or change its type until producers and stored
  data have completed a migration-first rollout.
- Preserve the boundary: Studio produces typed, schema-valid content and
  `packages/components` renders it. Published components must not import
  Studio code, call Studio APIs, depend on Studio-private symbols, or branch on
  Studio-internal feature flags.
- Keep the base published render paths server-renderable. Network-driven or
  browser-only behavior must be isolated in an explicit client hook or nested
  client component and must not execute during server rendering. Do not add
  top-level access to `window`, `document`, `localStorage`, or similar APIs in
  server-rendered modules.
- When changing a public schema, interface, type, constant, or component,
  verify that it is exported through the package's public entry point and that
  current Studio and template consumers remain compatible.
- Flag a compatibility problem only when you can identify the old content
  shape or concrete consumer that fails.
