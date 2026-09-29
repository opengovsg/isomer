---
applyTo: "apps/studio/src/server/**/*.ts,apps/studio/src/pages/api/**/*.ts"
---

# Studio server review instructions

- Require the appropriate authorization check in the router or API handler
  before calling a service, writing to the database, publishing, or causing an
  external side effect. A valid session proves authentication, not permission
  for the requested site or resource.
- Use `protectedProcedure` by default. `publicProcedure` and
  `webhookProcedure` are valid only for deliberately unauthenticated or
  API-key-authenticated callers. Do not accept ad hoc authentication middleware
  in individual routers.
- For every state-changing resource mutation, require the audit event and the
  write to use the same database transaction. Audit deltas must contain the
  actual persisted before and after values, rather than request input assumed
  to match the database.
- Require `.meta({ rateLimitOptions: ... })` for user-triggered procedures that
  call external services such as email, S3, or Singpass.
- Do not return raw database errors, caught `error.message` values, request
  data, stack traces, credentials, or other sensitive internal details to
  clients. Log server details with the request logger and return an appropriate
  generic `TRPCError` or HTTP response.
- Validate external input with the relevant Zod schema before it reaches
  business logic. Keep tRPC routers focused on input, authorization, and
  service orchestration rather than placing business logic in the callback.
