// Barrel for the redirect schema so existing `~/schemas/redirect` importers keep
// working unchanged. It re-exports ONLY `./redirect` — the schema surface.
//
// It deliberately does NOT re-export `./utils`. `./redirect` imports the
// `@opengovsg/isomer-components` barrel (for REFERENCE_LINK_REGEX), whose ESM
// `dist` is not resolvable by Node's native ESM loader — only by a bundler. So
// anything reached through THIS barrel inherits that un-loadable dependency,
// which is fine for the schema's consumers (server, client, vitest — all
// bundled) but fatal for non-bundler consumers (e.g. Playwright loading an e2e
// fixture). The pure path-normalisation helpers in `./utils` are safe for those
// consumers, so they must be imported directly from `~/schemas/redirect/utils`.
// Re-exporting them here would route that safe path back through the tainted
// barrel and reintroduce the module-load failure — do not add `./utils` below.
export * from "./redirect"
