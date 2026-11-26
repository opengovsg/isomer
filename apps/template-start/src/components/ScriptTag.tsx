import type { ComponentProps } from "react"

/** Stand-in for `next/script` used by @opengovsg/isomer-components analytics widgets. */
export const ScriptTag = (props: ComponentProps<"script">) => (
  <script {...props} />
)
