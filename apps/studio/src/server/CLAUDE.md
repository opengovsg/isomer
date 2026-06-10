# Server conventions (`apps/studio/src/server`)

This is the tRPC server for Studio. Read this before adding endpoints, middleware, or services.

## Layout

```
server/
├── context.ts              # Per-request context: session, prisma, req, res, gb (GrowthBook)
├── trpc.ts                 # tRPC init + middlewares + base procedures
├── webhooks.ts             # Non-tRPC webhook routes
├── cron/                   # Scheduled jobs (pg-boss workers)
└── modules/
    └── <area>/
        ├── <area>.router.ts    # tRPC router — endpoints only, no business logic
        ├── <area>.service.ts   # Pure functions — business logic + DB queries
        ├── <area>.select.ts    # Reusable Kysely select projections (optional)
        ├── <area>.types.ts     # Shared module-internal types (optional)
        └── __tests__/          # Vitest unit + integration tests
```

A module is a vertical slice of one domain (page, resource, auth, audit, permissions). New cross-module behaviour should compose existing services, not reach into another module's router.

## Procedure types — pick the right base

All four are exported from `~/server/trpc`:

| Procedure            | Use for                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| `publicProcedure`    | Endpoints that intentionally allow unauthenticated callers (very rare).       |
| `protectedProcedure` | The default. Requires a valid session, non-deleted user, and email whitelist. |
| `webhookProcedure`   | Server-to-server callers using `x-api-key` (e.g. CodeBuild).                  |

Never write your own auth middleware in a router. If you need a new auth shape, add a middleware in `trpc.ts` and a new exported base procedure.

## Required patterns

### Input validation lives in `~/schemas/`

- Define the Zod schema in `apps/studio/src/schemas/<area>.ts` and import it in the router.
- Routers should not declare ad-hoc inline schemas. If a schema is router-internal and tiny, keep it inline; otherwise lift it.

### Permission checks belong in the service

- Routers wire input → service. The service performs the permission check (`bulkValidateUserPermissionsForResources` and friends) **before** mutating.
- Do not gate purely on the existence of a session — that only proves the caller is logged in, not authorised for the resource.

### Audit-log every state change

- Mutations that change resource state must call `logResourceEvent` (or the appropriate `AuditLogEvent`) inside the same transaction as the write.
- Reads are not audited unless they expose sensitive data.

### Rate limiting via meta

- Attach rate limits with `.meta({ rateLimitOptions: ... })` on the procedure. The `rateLimitMiddleware` in `trpc.ts` reads this.
- Anything user-input-triggered that hits an external service (email, S3, Singpass) must have a rate limit.

### Errors

- Throw `TRPCError` with a `code` from the tRPC set. Pick the right code — never use `INTERNAL_SERVER_ERROR` for validation issues.
- Caught errors that leak request data must be logged with `ctx.logger` and re-thrown as a generic `INTERNAL_SERVER_ERROR` — never echo back database errors or stack traces.

## Database access

- Kysely (`db`) is the default. Prefer it for new queries.
- Prisma (`ctx.prisma`) is used for legacy queries and where Kysely lacks parity.
- Mix in one router only when necessary, and prefer one transaction owner per mutation.
- Migrations and schema live under `apps/studio/prisma/` — see `apps/studio/prisma/CLAUDE.md`.

## Testing

- Co-located under `__tests__/` in each module.
- Integration tests against a real Postgres via `pnpm services:setup` — do not mock the DB. (The doc rationale: mocked tests have masked broken migrations in past incidents.)
- Use the `createCallerFactory` exported from `trpc.ts` to call the router as a real authed user in tests.

## Adding a new module — checklist

1. Create `modules/<area>/` with the four files above.
2. Add the router to `modules/_app.ts`.
3. Define input schemas under `~/schemas/<area>.ts`.
4. Add at least one happy-path and one permission-denied test.
5. If the module mutates resources, wire `logResourceEvent` into every mutation.
6. Update this file if the module introduces a convention not covered here.

## Anti-patterns the agent should refuse

- Adding business logic inside a router callback.
- Validating input in the service instead of with a Zod schema.
- Calling another module's service to bypass that module's permission checks.
- Returning raw Prisma errors or `error.message` to the client.
- Adding a new `protectedProcedure`-equivalent middleware ad hoc in a router file.
