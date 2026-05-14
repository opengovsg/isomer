// Empty pnpmfile.
//
// pnpm 11 made .pnpmfile.mjs the default and loads it via dynamic import.
// When NODE_OPTIONS injects an ESM register hook (e.g. dd-trace's
// --import register.js used by Datadog Test Visibility), a missing file
// is surfaced as a fatal ERR_MODULE_NOT_FOUND instead of pnpm's usual
// silent skip, which breaks `pnpm exec` in CI. Keeping this file present
// (even empty) avoids that import failure.
export default {}
