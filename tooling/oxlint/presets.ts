export { default as core } from "ultracite/oxlint/core"
export { default as next } from "ultracite/oxlint/next"
export { default as react } from "ultracite/oxlint/react"
export { default as vitest } from "ultracite/oxlint/vitest"

export {
  default as antiSlop,
  antiSlopJsPluginEntries,
} from "./anti-slop.ts"

export {
  default as reactDoctor,
  jsPluginSettings,
  reactDoctorJsPluginEntries,
} from "./react-doctor.ts"
