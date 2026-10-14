---
applyTo: ".env.example,apps/studio/.env.example,apps/studio/src/env.mjs,**/package.json,pnpm-workspace.yaml,pnpm-lock.yaml,**/turbo.json,.github/workflows/**/*,.github/actions/**/*,tooling/build/**/*"
---

# Configuration review instructions

- For a new Studio environment variable, verify the Zod server or client
  schema, the explicit `processEnv` mapping in `apps/studio/src/env.mjs`, the
  relevant example environment file, and every build or runtime deployment
  surface that must provide it. Report the exact missing consumer rather than
  requesting propagation everywhere.
- Never expose a secret through a `NEXT_PUBLIC_` variable, client bundle,
  public build argument, workflow output, or log. Client variables must be
  intentionally public and declared in the client schema.
- Use `catalog:` for shared external dependencies declared in
  `pnpm-workspace.yaml` and `workspace:*` for internal workspace packages.
  Preserve documented compatibility pins unless all named consumers are
  migrated in the same rollout.
- Require `pnpm-lock.yaml` to match dependency manifest changes. Do not report
  findings in a mechanically updated lockfile unless they reveal a concrete
  manifest, integrity, platform, or lifecycle-script problem.
- When changing package scripts, Turbo tasks, or GitHub workflows, identify the
  affected workspace or CI/deployment caller and ensure its command, inputs,
  outputs, and required environment remain connected.
