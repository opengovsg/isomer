# Bridge components

When a design-system-react component or variant has **no clean OUI equivalent**, prefer
building a small **bridge component** in the app over (a) blocking on an OUI upstream
change or (b) leaving the old component. A bridge is a thin wrapper over a primitive —
`react-aria-components` and/or OUI's exported `*Styles` (tailwind-variants) functions —
that reproduces the old appearance/API. This keeps the migration unblocked and the
result OUI-native.

Put bridges in `apps/studio/src/components/oui-bridge/`. Keep each tiny and documented
with the gap it fills. They're also reusable across repos doing the same DS → OUI move.

## When to bridge vs. flag upstream

- **Bridge** when the gap is composable from primitives (a styling variant, a wrapper,
  an icon-only/loading affordance). Cheap, local, no upstream wait.
- **Flag upstream** (and bridge meanwhile) when the gap is a genuinely missing OUI
  capability many products need — the bridge becomes the reference for the upstream API.
- Record every bridge in the playbook's gaps register.

## Pattern: reuse OUI's `*Styles`

OUI components are `react-aria-components` primitives + an exported tailwind-variants
function (`buttonStyles`, `linkStyles`, …, from `@opengovsg/oui-theme`). To bridge, apply
the closest `*Styles` to the matching primitive — you get OUI-accurate visuals for free.
Merge consumer classes with **`cn` from `@opengovsg/oui-theme`** (a re-exported
tailwind-merge — yes, it's available; do not hand-roll string concatenation).

> **A bridge that renders its own children (spinner/icon + label) must own their
> layout.** `linkStyles`' base is `inline` (and `*:inline`), so a spinner + label would
> not align or get a gap. Add `flex flex-row items-center gap-2` (or similar) in the
> bridge. Likewise, when a `*Styles` recipe disables the label in some state (OUI's
> `Button` hides children while `isPending`), the bridge must re-render the label itself
> if that state should keep text. Always exercise the **loading / icon+label** states in
> the visual check, not just the resting state.

### `LinkButton` — fills `Button variant="link"` (no OUI Button `link` variant)

A link-looking control for `onPress` actions (not navigation). react-aria `Button` +
OUI `linkStyles`. Owns its flex layout so the (optional) pending spinner sits inline with
the label, and keeps the label visible while pending (OUI's Button would hide it):

```tsx
import type { LinkVariantProps } from "@opengovsg/oui-theme"
import type { ButtonProps } from "react-aria-components"
import { Spinner } from "@opengovsg/oui"
import { cn, linkStyles } from "@opengovsg/oui-theme"
import { forwardRef } from "react"
import { Button, composeRenderProps } from "react-aria-components"

interface LinkButtonProps extends ButtonProps, LinkVariantProps {}

export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(
  ({ children, isPending, color, radius, isFocusVisible, ...props }, ref) => (
    <Button
      {...props}
      ref={ref}
      isPending={isPending}
      className={composeRenderProps(props.className, (className, renderProps) =>
        linkStyles({
          color,
          radius,
          className: cn("flex flex-row items-center gap-2 w-fit", className),
          ...renderProps,
          isFocusVisible: isFocusVisible ?? renderProps.isFocusVisible,
        }),
      )}
    >
      {composeRenderProps(children, (resolved) => (
        <>
          {isPending ? <Spinner size="xs" /> : null}
          {resolved}
        </>
      ))}
    </Button>
  ),
)
```

Migration: `<Button variant="link" onClick={fn}>` → `<LinkButton onPress={fn}>`,
`isLoading`→`isPending`. Verified against the gate (resting **and** loading states) —
renders as a proper link that keeps its label with a leading spinner while pending.

Refinements learned in practice (don't skip these):

- **`forwardRef` to the underlying primitive.** Wrap the bridge in `forwardRef` and pass `ref`
  down. Without it the bridge can't serve as an **overlay trigger** (Tooltip/Popover/Menu need a
  ref on the trigger child to position/wire it) and React warns on ref-passing. Applies to every
  bridge here (`LinkButton`, `ButtonLink`, `IconButton`), not just this one.
- **Forward `linkStyles`' variant props** (`color`, `radius`) via `LinkVariantProps` so callers
  pick the link colour (`color="neutral"`) without reaching for arbitrary `text-*` classes.
  Forward `isFocusVisible` too (`isFocusVisible ?? renderProps.isFocusVisible`) so the focus ring
  is correct, and add `w-fit` so the hit area hugs the text.
- **Underline is NOT default.** The DS `variant="link"` had no underline by default; do **not**
  bake `underline` into the bridge base. Opt in per-usage with an `underline` class where the
  design wants it.
- **Style the LinkButton, don't wrap a `<Text>`.** Pass **plain text children** and set the type
  scale on the bridge itself (`className="prose-body-2"`, `color="neutral"`), rather than nesting
  a Chakra `<Text>` inside — the wrapper fights the link's inline layout and re-introduces Chakra.
- For shared call sites, wrap the bridge once (e.g. a `ResendOtpButton` that fixes
  `className="prose-subhead-2 font-normal whitespace-pre-wrap gap-0 …"`) so the styling lives in
  one place instead of being re-derived per usage.

### `IconButton` — fills DS `IconButton` (OUI only has `Button isIconOnly`)

Keeps the DS `icon=` + `aria-label` API:

```tsx
interface IconButtonProps
  extends Omit<ComponentProps<typeof Button>, "children" | "isIconOnly"> {
  "aria-label": string
  icon: ReactNode
}
export const IconButton = ({ icon, ...props }: IconButtonProps) => (
  <Button isIconOnly {...props}>{icon}</Button>
)
```

Migration: `colorScheme→color`, `onClick→onPress`, `isRound→radius="full"`, Chakra style
props → `className`. Verified 8px against the gate. Decorative `as="div"`/`isActive`
IconButtons aren't real buttons — handle case-by-case (styled element).

### `ButtonLink` — fills polymorphic `Button as={NextLink} href=...`

A navigational link that looks like a button. react-aria `Link` + OUI `buttonStyles`
(extract the `ButtonVariantProps` keys, pass the rest to `Link`); client-side nav comes
from the app's `RouterProvider`. Migration: `as={NextLink} href` → `href`, style props →
`className`, a `rightIcon` becomes an inline child. Verified no-diff against the gate.

> **react-aria `Link`/`Button` strip non-data, non-labelable ARIA attributes** (their
> `filterDOMProps` keeps `data-*`, `id`, and only the labelable aria props — `aria-label`,
> `-labelledby`, `-describedby`, `-details`). So `aria-selected`/`aria-expanded`/`aria-pressed`
> set on a bridge **never reach the DOM**, and any `aria-selected:bg-…` style silently does
> nothing. For **stateful styling on a bridge**, drive it off the boolean directly
> (`className={isActive ? "bg-… hover:bg-…" : ""}`) or a forwarded `data-*` attribute
> (`data-selected={dataAttr(isActive)}` + `data-[selected]:bg-…`), and use the semantically
> correct ARIA (`aria-current="page"` for a nav link). This caused a real regression — the
> directory sidebar's active row lost its highlight because `aria-selected` was dropped.
