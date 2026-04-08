# @isomer/logging

Shared Pino setup for Isomer: syslog-style custom levels, ISO timestamps, uppercase `level`, and a root binding `env` (deployment label). This package does **not** import application env modules or HTTP frameworks—callers pass plain configuration and optional request-derived fields.

## Dependencies

`pino`, `pino-pretty`, and `nanoid` are **direct dependencies** of this package (same pattern as `@isomer/pgboss` shipping `pino`). Apps that only need the `Logger` **type** can keep a matching `pino` version in their own `package.json` for TypeScript.

## API

- **`Logger`** — re-exported `pino` `Logger` type for parameters (e.g. `@isomer/pgboss` APIs).

- **`createRootLogger(options)`** — build one root logger per process (typically behind a module-level singleton). Options:
  - `nodeEnv` — used to choose the default transport: `development` / `test` → `pino-pretty`; otherwise stdout.
  - `appEnvLabel` — string stored on every line as `env`.
  - `logLevel` — optional; defaults to `process.env.PINO_LOG_LEVEL` or `info`.
  - `destination` — optional `DestinationStream` override (tests, custom sinks).

- **`createChildLogger(parent, { path, clientIp?, traceId? })`** — returns a child with stable field names: `path`, `id` (nanoid), `clientIp`, `trace_id` (from `traceId`). Use this for per-request or per-job context.

- **`SYSLOG_LEVELS`** — exported level map if you need to reference the same numeric scale elsewhere.

## Usage in Studio (Next.js)

Keep a thin adapter in the app: read validated env, map `NextApiRequest` to `clientIp` / `traceId`, then call `createRootLogger` / `createChildLogger`. See `apps/studio/src/lib/logger.ts`.

## Observability / Datadog

Trace correlation is a **caller concern**: read `x-datadog-trace-id` (or other headers) in your HTTP layer and pass the string as `traceId`. Keeping this out of the core package avoids pulling in framework-specific header types.
