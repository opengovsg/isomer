import type { MenuItem } from "@opengovsg/oui"
import type { ComponentProps } from "react"

type MenuItemClassNames = ComponentProps<typeof MenuItem>["classNames"]

/**
 * OUI's MenuItem has no critical/destructive color variant, so the red
 * "delete"-style item is expressed via classNames. The focused/pressed
 * overrides use data-attribute variants (higher specificity than OUI's
 * built-in `bg-interaction-muted-main-*`), so they win over the default blue.
 */
export const CRITICAL_MENU_ITEM_CLASSNAMES: MenuItemClassNames = {
  container:
    "text-interaction-critical-default data-[focused]:bg-interaction-muted-critical-hover data-[pressed]:bg-interaction-muted-critical-active",
}
