// Upper bound to limit request parsing and SQL cost (ANY(...) on text[]).
// Arbitrary limit to prevent abuse; adjust if legitimate collections exceed this.
// Kept in a standalone module so Playwright e2e can import it without loading
// ~/schemas/collection (which pulls @opengovsg/isomer-components and breaks under
// strict Node ESM — see redirect.ts REFERENCE_LINK_REGEX duplication).
export const MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT = 100
