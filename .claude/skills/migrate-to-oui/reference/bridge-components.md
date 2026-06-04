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
import type { ButtonProps } from "react-aria-components"
import { Spinner } from "@opengovsg/oui"
import { cn, linkStyles } from "@opengovsg/oui-theme"
import { Button, composeRenderProps } from "react-aria-components"

export const LinkButton = ({ children, isPending, ...props }: ButtonProps) => (
  <Button
    {...props}
    isPending={isPending}
    className={composeRenderProps(props.className, (className, renderProps) =>
      linkStyles({
        className: cn("flex flex-row items-center gap-2", className),
        ...renderProps,
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
)
```

Migration: `<Button variant="link" onClick={fn}>` → `<LinkButton onPress={fn}>`,
`isLoading`→`isPending`. Verified against the gate (resting **and** loading states) —
renders as a proper link that keeps its label with a leading spinner while pending.

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
