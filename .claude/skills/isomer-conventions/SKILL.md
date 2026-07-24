---
name: isomer-conventions
description: Repository-specific code smells and blessed conventions for the Isomer Next monorepo. Use when writing or reviewing code in this repo (tRPC routers, Kysely/Prisma access, zod schemas, React components, tests) to catch deviations from team conventions, and when the user wants to record a new code smell or best practice ("remember this convention", "add a code smell", "we always/never do X here").
---

# Isomer conventions

A growable catalog of repo-specific code smells (patterns to avoid) and best
practices (the blessed way). Each entry lives in its own file under
`conventions/`; the [Catalog](#catalog) below indexes them. The catalog starts
empty and grows as the team discovers conventions during review.

## Applying conventions

When writing or reviewing code in this repo:

1. Skim the [Catalog](#catalog) and load any entry whose hook looks relevant to
   the diff/file at hand. Don't load all of them — only what's relevant.
2. For each relevant entry, check the code against it.
3. Flag violations as `path:line` — name the convention, show the blessed
   pattern, and (for smells) why it matters. Cite the entry file.
4. When writing new code, follow the matching best-practice entries by default.

If the catalog is empty or nothing matches, fall back to general good judgment —
do not invent repo conventions that aren't recorded here.

## Adding a new entry

Triggered when the user says things like "remember this", "add a code smell",
"we always/never do X here", or describes a convention while reviewing code.

1. **Check for an existing entry first.** If one covers the same ground, update
   it instead of creating a duplicate.
2. Create `conventions/<kebab-slug>.md` following
   [conventions/TEMPLATE.md](conventions/TEMPLATE.md). Keep it short — a smell,
   why, a Bad/Good pair, and how to detect it. Ground examples in real
   `path:line` from the repo when possible.
3. Add a one-line pointer to the [Catalog](#catalog) below, grouped under its
   category (create the category heading if it's new).
4. Confirm what you saved in one line.

Keep SKILL.md lean: detail lives in the entry files, never inline here.

## Catalog

### React

- [Prefer a new component over overloading props](conventions/react-new-component-over-prop-overload.md) — smell: flag soup / single-caller props bending one component into two jobs
- [Build forms with useZodForm, not per-field useState](conventions/react-forms-usezodform-over-usestate.md) — best practice: forms use the zod-wired useForm wrapper, schema reused from ~/schemas
- [Drive modals with useDisclosure, renamed on destructure](conventions/react-modal-usedisclosure-renamed.md) — best practice: modals use Chakra's useDisclosure (not custom useState), aliased to names like isDeleteModalOpen

### Audit logging
- [Audit deltas must log real DB rows, not hand-built objects](conventions/audit-log-real-db-rows.md) — best practice: log before/after as rows re-read from the DB inside the same tx, so deltas are accurate

### Readability
- [Document every regex, and keep the comment correct](conventions/document-regex-with-verified-comments.md) — best practice: comment what + why a regex matches, and verify the comment is accurate

### Testing
- [Structure tests as Arrange / Act / Assert](conventions/tests-arrange-act-assert.md) — best practice: mark AAA phases (collapse adjacent markers when trivial), one Act per test
- [E2E test conventions (Studio Playwright suite)](conventions/e2e-tests.md) — best practice: fixtures layout, helpers vs POs, per-site isolation, happy-path + permission-gate pattern

### Feature flags

- [Gate risky changes behind a GrowthBook flag; canary via enabledSites](conventions/growthbook-flag-risky-changes.md) — best practice: risky changes ship behind a GrowthBook flag (key constant + safe fallback); canary to chosen agencies via `enabledSites`, or to individuals via GrowthBook's native `email` targeting

### Dependencies

- [Reference catalog packages via "catalog:" not direct version strings](conventions/pnpm-catalog-references.md) — smell: direct version strings in package.json for packages defined in pnpm-workspace.yaml catalog

### Configuration

- [Register a new env var in .env.example, .env.test (and turbo.json if read by a task)](conventions/env-var-registration.md) — best practice: propagate a new env var beyond env.mjs to the example/test files and turbo globalEnv, or setup/CI/cache silently drift

### Dates & time

- [Build canonical date/month strings with date-fns-tz, not an Intl locale trick](conventions/canonical-dates-via-date-fns-not-intl-locale.md) — best practice: produce comparison/storage strings (e.g. `yyyy-MM`) with `formatInTimeZone` + explicit token, not `Intl.DateTimeFormat("en-CA")`; reserve locale formatting for display

<!-- Each line: [Title](conventions/slug.md) — short hook (smell/best practice).
     Group under a category heading; create the heading if it's new. -->
