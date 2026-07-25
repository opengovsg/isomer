// Pure path-normalisation helpers for redirect sources and destinations.
//
// Deliberately free of any "@opengovsg/isomer-components" import: ./redirect
// pulls in the components barrel (for REFERENCE_LINK_REGEX), whose ESM `dist`
// is not resolvable by Node's native ESM loader — only by a bundler. Consumers
// that load this code WITHOUT a bundler (e.g. Playwright loading an e2e fixture
// that needs the same normalisation) must import from here, not ./redirect,
// so they don't drag in that un-loadable barrel.

// Strips slashes from both ends of a path so "/foo/", "foo" and "foo//"
// all normalise to the same inner segments before validation.
export const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "")

// Normalises a path to a single leading slash, no trailing slash, collapsed
// runs ("/foo/", "foo", "foo//" -> "/foo"). Exported so the server can compare
// a destination path against stored sources, persisted in this form.
export const normalizeRedirectPath = (value: string) =>
  `/${trimSlashes(value).replace(/\/{2,}/g, "/")}`

// Sources are additionally lowercased — page permalinks are lowercase-only, so
// a source must lowercase to compare against (and not shadow) a real page.
// Exported so the server's source/loop guards compare in the same form.
export const normalizeRedirectSource = (value: string) =>
  normalizeRedirectPath(value).toLowerCase()
