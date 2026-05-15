# @isomer/logging

Shared Pino setup for Isomer: syslog-style custom levels, ISO timestamps, uppercase `level`, and a root binding `env` (deployment label). This package does **not** import application env modules or HTTP frameworks — callers pass plain configuration and any request-derived fields.

## API

- **`Logger`** — re-exported `pino` `Logger` type.
- **`createBaseLogger(options)`** — returns a child logger off a process-wide singleton. Options:
  - `nodeEnv` — picks transport: `development` / `test` → `pino-pretty`; otherwise stdout.
  - `appEnvLabel` — string stored on every line as `env`.
  - `path` — bound on the child.
  - `clientIp?` — bound on the child.
  - `traceId?` — bound on the child as `trace_id`.

The pino level is read from `process.env.PINO_LOG_LEVEL` (defaults to `info`).

## Usage in Studio (Next.js)

Keep a thin adapter in the app: read validated env, map `NextApiRequest` to `clientIp` / `traceId`, then call `createBaseLogger`. See `apps/studio/src/lib/logger.ts`.

## Datadog tracer

`@isomer/logging/tracer` exposes `initTracer({ service })`. Call it from your runtime entrypoint (e.g. Next.js `instrumentation.ts`), passing the service name to register with Datadog.
