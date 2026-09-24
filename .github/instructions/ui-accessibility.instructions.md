---
applyTo: "apps/studio/src/**/*.tsx,packages/components/src/**/*.tsx"
---

# UI accessibility review instructions

- Every changed interactive control must be keyboard reachable and operable
  and must expose an accessible name. Prefer native elements and the existing
  Chakra UI or React Aria primitives over recreating their behavior.
- Flag click handlers on non-interactive elements when there is no equivalent
  keyboard interaction, focusability, and semantic role.
- Icon-only controls need a meaningful accessible name. Decorative icons must
  be hidden from assistive technology when adjacent text already supplies the
  name.
- Images conveying content need meaningful alternative text; decorative images
  use an empty `alt` value. Do not duplicate surrounding text in alt text
  without adding information.
- Do not rely on color alone to communicate state, errors, selection, or
  required actions. Preserve visible keyboard focus and sufficient non-text
  contrast for controls and state indicators.
- Report an accessibility finding only when the changed interaction creates a
  concrete keyboard, screen-reader, focus, naming, or perception failure; do
  not request redundant ARIA where native semantics are already sufficient.
