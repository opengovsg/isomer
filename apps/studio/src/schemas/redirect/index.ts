// Barrel for `~/schemas/redirect`. Re-exports `./redirect` only.
//
// Do not re-export `./utils`. `./redirect` imports `@opengovsg/isomer-components`
// (REFERENCE_LINK_REGEX). That package's ESM dist won't load under Node's native
// ESM loader; only a bundler resolves it. Importing this barrel drags that
// dependency along. Server, client, and vitest are bundled, so they're fine.
// Playwright e2e fixtures load modules without a bundler and will fail.
//
// Path helpers in `./utils` don't touch isomer-components. Import them from
// `~/schemas/redirect/utils`. Adding `./utils` here would route those imports
// through this file and break fixture loads again.
export * from "./redirect"
