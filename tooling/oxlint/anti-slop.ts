import antiSlop from "ultracite/oxlint/anti-slop"

/** Re-declare on the root config so dependency analyzers see the bundled plugin. */
export const antiSlopJsPluginEntries = antiSlop.jsPlugins

export default antiSlop
