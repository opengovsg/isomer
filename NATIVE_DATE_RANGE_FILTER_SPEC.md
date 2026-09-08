# Spec: Replace `DateRangeFilterInput` with native `<input type="date">`

## Background

`DateRangeFilterInput` (`packages/components/src/templates/next/components/internal/Filter/DateRangeFilterInput/`) is a date-range filter control for published Isomer sites. It is currently built on `@react-aria/calendar`, `@react-stately/calendar`, and `@internationalized/date`, rendering a single masked text field (`DD/MM/YYYY - DD/MM/YYYY`) plus a custom calendar popover (`RangeCalendar/`) for picking a start/end date.

Because `packages/components` is published to npm and its output ships to every Isomer site (see the package's `CLAUDE.md`), every dependency here has an outsized bundle-size cost compared to an admin-only dependency.

The component is not yet wired into `Filter.tsx`/`FilterDrawer.tsx` — it is only referenced by its own Storybook story and its own test file. There are no external consumers to keep backward-compatible.

**Out of scope:** the `DatePicker` from `@opengovsg/design-system-react` used in Studio's admin forms (Gazette publish date, scheduled-publish date, JSON Forms date control). That's a separate, pre-existing external dependency in a different app with different bundle-size constraints.

## Goal

Replace the react-aria/custom-calendar implementation with two native `<input type="date">` fields (From / To), removing the dependencies that exist solely to power this component, while keeping the component's external props contract close to its current shape.

## Dependency impact

| Package | Used elsewhere in `packages/components`? | Outcome |
|---|---|---|
| `@react-aria/calendar` | No | Removed from `package.json` |
| `@react-stately/calendar` | No | Removed from `package.json` |
| `@internationalized/date` | No | Removed from `package.json` |
| `date-fns` | Yes (`utils/getParsedDate.ts`, `utils/getFormattedDate.ts`, `utils/getSingaporeDate.ts`, story fixtures) | Stays in `package.json`; this component stops using it |
| `@react-aria/focus`, `@react-aria/interactions`, `@react-aria/button`, `@react-aria/textfield`, `@react-aria/checkbox`, `@react-stately/checkbox`, `@react-stately/toggle`, `@react-aria/utils` | Yes (used by other internal components) | Stay in `package.json` — unaffected by this change |

## Component API

Keep the component named `DateRangeFilterInput`. One intentional contract change:

```ts
// Before
export interface DateRangeFilterValue {
  start: string // ISO yyyy-MM-dd, required
  end: string    // ISO yyyy-MM-dd, required
}

// After
export interface DateRangeFilterValue {
  start?: string // ISO yyyy-MM-dd
  end?: string   // ISO yyyy-MM-dd
}
```

Props stay the same shape otherwise:

```ts
interface DateRangeFilterInputProps {
  value: DateRangeFilterValue | undefined
  onChange: (value: DateRangeFilterValue | undefined) => void
}
```

- `value: undefined` — both fields empty.
- `value: { start }` — open-ended range, "from `start` onward."
- `value: { end }` — open-ended range, "up to `end`."
- `value: { start, end }` — closed range.

## Behavior

- **Two independent native inputs.** `<input type="date">` for "From" and `<input type="date">` for "To." No custom calendar icon, no custom popover, no `FocusScope`, no click-outside handling, no `useBreakpoint`/overlay-vs-popover switching — each browser's own date picker affordance is used as-is.
- **Live commit, no Apply button.** `onChange` fires as soon as the From/To state changes and passes validation (see below). `CalendarActionButton` is deleted along with the two-step select-then-apply flow.
- **Open-ended ranges are valid.** Setting only From or only To is a legitimate value and is passed through via `onChange`.
- **Validation:** if both From and To are set and From > To, do not call `onChange` with that pair — show an inline validation error (reuse the existing error-state styling: `shadow-utility-feedback-error-medium` container treatment + the existing error text style) until the user corrects it.
- **Clearing:** clearing one field no longer clears the other — each field's emptiness is independent, consistent with open-ended ranges being valid. `onChange(undefined)` only when both are empty.

## Labels & layout

- Each input gets its own **visible** `<label>`: "From" and "To" (not sr-only) — replacing the current single "Or, search for a date" label.
- Layout: From and To side-by-side (flex row), wrapping to stacked via plain CSS on narrow viewports. No JS-driven breakpoint switching.

## Styling

- Fully restyle the input chrome (border, background, focus ring, error state) to match the existing Isomer input treatment (rounded, shadow-based border, `shadow-utility-feedback-error-medium` on error) — same visual language as today's `dateRangeInputFieldStyles`.
- The calendar **popup** itself (the dropdown the browser renders when the input is activated) is not restyled — it is entirely owned by the browser and its appearance will differ across Chrome, Firefox, and Safari. This is an accepted tradeoff, not a bug.
- Do not attempt to hide the native calendar icon (e.g. via `::-webkit-calendar-picker-indicator`) or add a custom icon — no plan to standardize the icon look across browsers.

## Platform limitations accepted

These are inherent to native `<input type="date">` and are accepted as tradeoffs for removing the dependencies, not treated as defects:

- **Display format is locale-dependent.** The stored value is always ISO `yyyy-MM-dd`, but what the user sees while editing (e.g. `MM/DD/YYYY` vs `DD/MM/YYYY`) follows the browser/OS locale and cannot be forced to a fixed format.
- **Desktop Safari 12–14.0** (within the package's declared `browserslist` range: `safari >= 12`) does not support the native date picker UI for `<input type="date">` — it falls back to a plain text input. Set a `placeholder` (e.g. `yyyy-mm-dd`) on each input so these users get a format hint; no further fallback behavior is implemented.
- **`showPicker()` is not used** — its browser support (Chrome/Edge 99+, Firefox 101+, Safari 16.4+) is above the package's declared minimum baseline, and it's unnecessary now that there's no custom trigger icon.

## Files

**Deleted:**
- `RangeCalendar/RangeCalendar.tsx`
- `RangeCalendar/CalendarCell.tsx`
- `RangeCalendar/CalendarGrid.tsx`
- `RangeCalendar/CalendarActionButton.tsx`
- `DateRangeFilterTextInput.tsx`
- `dateRangeFilterInputFormatting.ts` (masked single-field text formatting/parsing)

**Rewritten:**
- `DateRangeFilterInput.tsx` — two native inputs, validation, layout described above.
- `dateRangeFilterInputText.ts` — keep `DateRangeFilterValue` (now with optional fields); drop the free-text range parsing/formatting logic (`parseInputText`, `valueToInputText`, display-format helpers) since there's no single free-text field anymore.
- `DateRangeFilterInput.stories.tsx` — update to the new props/UI.
- `__tests__/DateRangeFilterInput.browser.test.tsx` — rewrite; must cover: setting a closed range, an open-ended range (From-only, To-only), clearing individual fields independently, and the From > To validation error.

**Unaffected:**
- `Filter.tsx`, `FilterDrawer.tsx` — no changes needed, since `DateRangeFilterInput` isn't wired in yet.

## Non-goals

- No min/max date bounds (e.g. disallowing future dates) — not present today, not being added.
- No dark-mode / `color-scheme` handling.
- No feature-detection or UA-sniffing fallback for old Safari beyond the `placeholder` hint.
- No changes to `@opengovsg/design-system-react` `DatePicker` usage in Studio.
