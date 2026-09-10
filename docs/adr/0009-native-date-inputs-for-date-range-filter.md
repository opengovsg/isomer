# 0009: Use native `<input type="date">` for collection date range filters

## Status

Accepted

## Context

Collection date filters need a date-range control in `packages/components`, which ships to every published Isomer site. Dependencies in that package have an outsized bundle-size cost.

An earlier approach used `@react-aria/calendar`, `@react-stately/calendar`, and `@internationalized/date` to build a custom calendar with a masked text field. That gave full control over UX but added calendar-only dependencies and substantial component code for a single filter input.

Studio's `@opengovsg/design-system-react` `DatePicker` is out of scope — it serves admin forms and lives under different bundle-size constraints.

## Decision

Use two native `<input type="date">` fields ("From" / "To") for `DateRangeFilterInput` instead of a custom calendar.

## Considered options

- **Custom react-aria calendar + masked text field** — consistent cross-browser UX and a fixed display format, at the cost of extra dependencies and maintenance.
- **Native `<input type="date">` (chosen)** — no calendar-specific dependencies, smaller bundle, less code. Sacrifices control over picker UX.

## Consequences

These are accepted tradeoffs, not bugs:

- **Locale-dependent display format.** Values are stored as ISO `yyyy-MM-dd`, but the format shown while editing follows the browser/OS locale.
- **No control over the calendar icon.** Cannot hide the native calendar picker indicator, resize its touch target, or use a different cursor for the text field vs the icon.
- **No control over the calendar popup.** The dropdown the browser renders on activation cannot be styled; its appearance differs across Chrome, Firefox, and Safari.
- **Older Safari fallback.** Desktop Safari 12–14 falls back to a plain text input with no native picker UI.
