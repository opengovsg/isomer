import { defineConfig } from "oxlint"
import {
  jsPluginSettings,
  selectJsPlugins,
} from "ultracite/oxlint/js-plugins"

/** React Doctor via oxlint JS plugins. Use with Ultracite `react` for ported react/hooks/a11y rules. */
const reactDoctorBase = selectJsPlugins(["react-doctor"])

const reactDoctor = defineConfig({
  ...reactDoctorBase,
  rules: {
    ...reactDoctorBase.rules,
    // Off: we don't use React Compiler. Turn on with babel-plugin-react-compiler.
    "react-doctor/react-compiler-no-manual-memoization": "off",
  },
})

/** Re-declare on the root config so dependency analyzers see the package. */
export const reactDoctorJsPluginEntries = reactDoctor.jsPlugins

export { jsPluginSettings }
export default reactDoctor
