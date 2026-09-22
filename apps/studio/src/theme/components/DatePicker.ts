import { theme as ogpDsTheme } from "@opengovsg/design-system-react"

// The library's baseStyle is a function (it needs props to resolve theme
// text styles). extendTheme can't merge a function with a plain object
// override, so overriding it directly drops the original header/field/
// calendarButton styling. Wrapping the function preserves it.
const dsThemeComponents = ogpDsTheme.components as Record<string, unknown>
const originalDatePicker = dsThemeComponents.DatePicker as {
  baseStyle: (props: Record<string, unknown>) => Record<string, unknown>
  sizes?: unknown
}

export const DatePicker = {
  ...originalDatePicker,
  baseStyle: (props: Record<string, unknown>) => {
    const base = originalDatePicker.baseStyle(props)
    return {
      ...base,
      container: {
        ...(base.container as Record<string, unknown> | undefined),
        // Popper doesn't always keep this popover on-screen, and a static
        // vh-based max-height can't compensate since it doesn't know where
        // Popper placed the box. useClampDatePickerHeight sets the real
        // max-height at runtime; this just enables scrolling for when it does.
        overflowY: "auto",
      },
    }
  },
}
