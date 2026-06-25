# Algolia is the default document-index backend; SearchSG sits behind a GrowthBook flag

The gazette document index can be served by either Algolia or SearchSG. We push to **Algolia by default**; a GrowthBook flag, evaluated in the push cron (via `createGrowthBookContext`) and in the router delete flow, swaps the destination to **SearchSG** when needed. The two backends are **mutually exclusive** per tick ("swap over"), not written in parallel.

## Considered Options

- **Push to both backends every tick** — keeps the indexes in lockstep, but doubles push cost and failure modes and contradicts the intent of being able to *swap* destinations.
- **SearchSG only (status quo)** — rejected because we want Algolia as the primary index, matching the egazette parameters.
- **Algolia default, SearchSG behind a flag (chosen)** — lets us run on Algolia while retaining a tested, instant fallback to SearchSG for the document index without a deploy.

## Consequences

- **Delete follows the flag.** The human-driven delete flow (15-minute grace period) removes records from whichever backend the flag currently points at. If the flag is flipped between a gazette's publish and its deletion, the records in the *other* backend are orphaned. We accept this: the window is small (grace period only) and flag flips are rare, deliberate operations.
- Both the cron and the router must read the flag; keep the evaluation identical so push and delete agree under normal (non-flipped) operation.
