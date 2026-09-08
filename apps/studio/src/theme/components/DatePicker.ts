import { theme as ogpDsTheme } from "@opengovsg/design-system-react"

// The library's own DatePicker theme defines `baseStyle` as a function (it
// needs `props` to resolve theme text styles). Overriding the key outright
// (a plain object) rather than wrapping this function is silently dropped
// by extendTheme's merge — a function and a plain object aren't
// deep-mergeable, so the override key wins wholesale and the rest of the
// original styling (header, field, calendarButton...) disappears instead of
// layering on top of it. Wrapping it preserves everything else.
const originalDatePicker = ogpDsTheme.components.DatePicker as {
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
        // Popper's flip/preventOverflow doesn't reliably keep this popover
        // fully on-screen (confirmed: it can settle at a position where the
        // calendar still overflows past the viewport bottom). A static
        // vh-based max-height can't fix that either, since it doesn't know
        // where Popper actually placed the box. useClampDatePickerHeight
        // measures the real available space at runtime and sets an accurate
        // inline max-height — this just declares the scroll behavior for
        // when it does.
        overflowY: "auto",
      },
    }
  },
}
