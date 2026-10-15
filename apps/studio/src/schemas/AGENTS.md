# Zod schemas (`apps/studio/src/schemas`)

This folder is the single source of truth for **input schemas shared between the tRPC server and any client that calls it.** Server routers and client forms import from here so the types stay in lockstep.

## What lives here

- One file per domain area (`page.ts`, `resource.ts`, `site.ts`, `user.ts`, …).
- Shared primitives in `common.ts` (e.g. permalink generators, common string constraints).
- Pagination and webhook schemas (`pagination.ts`, `webhook.ts`).
- The `auth/` subfolder for login and Singpass flows.
- Tests under `__tests__/`.

## What does _not_ belong here

- **Feature-internal schemas used by exactly one component** — put them in `features/<area>/schema.ts`.
- **Database row shapes** — those come from Prisma's generated types under `~prisma/generated/`.
- **Component / template content schemas for published sites** — those live in `packages/components/src/schemas/`.

## Conventions

### Naming

- Schemas: `<action><Entity>Schema` — e.g. `createPageSchema`, `updatePageMetaSchema`, `publishPageSchema`.
- Inferred types: `type X = z.infer<typeof xSchema>` exported next to the schema.
- Constants used by multiple schemas (e.g. `MAX_TITLE_LENGTH`) live in the same file and are exported.

### Composition

- Compose with `.extend()` and `.merge()` rather than redeclaring fields.
- Reuse `basePageSchema`, `baseResourceSchema`, etc. for common identifier shapes.
- Pull permalink, slug, URL constraints from `common.ts` — do not redefine character classes inline.

### Error messages

- Every `.min()` / `.max()` / `.regex()` must have a user-facing `message`. Generic Zod messages ("Required") leak through to forms.
- Messages should be sentence case, no trailing period, and address the user ("Enter a title for this page", not "Title is required").

### Server-only schemas

- Some schemas are server-internal (e.g. `scheduledPublishServerSchema`). Suffix them with `ServerSchema` to make the boundary obvious — the client should never import these.

### JSON content validation

- For block/JSON content validated against an external schema (`@opengovsg/isomer-components`), compile the JSON Schema with `ajv` at module load and export the compiled validator. Do not recompile per request.

## Testing

- Unit tests under `__tests__/` covering boundary cases for any schema with non-trivial rules (regex, conditional refinement, transforms).
- For schemas that depend on Prisma enums (`ResourceState`, `ResourceType`), import the enum so the schema fails type-check if the enum changes.

## Adding a new schema — checklist

1. Decide if it's shared (this folder) or feature-internal (`features/<area>/schema.ts`).
2. Reuse `common.ts` primitives where possible.
3. Export the inferred type alongside the schema.
4. Add user-facing `message` to every validator.
5. Add the schema to `__tests__/` if it has any conditional rules.

## Anti-patterns the agent should refuse

- Declaring inline `z.object(...)` schemas inside a router file when more than one caller needs the shape.
- Schemas without `message` strings on constraints.
- Hand-written types that duplicate `z.infer` output.
- Importing a `*ServerSchema` from client code.
