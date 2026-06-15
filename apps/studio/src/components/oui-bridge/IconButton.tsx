import type { ComponentProps, ReactNode } from "react"
import { Button } from "@opengovsg/oui"
import { forwardRef } from "react"

/**
 * Bridge for design-system-react's `IconButton`, which OUI has no component for (only
 * `Button isIconOnly`). Keeps the DS API: an `icon` element + required `aria-label`,
 * rendered as an OUI icon-only Button. Forwards its ref so it can act as an overlay
 * trigger (MenuTrigger/Tooltip/Popover need a ref on the trigger child).
 */
interface IconButtonProps extends Omit<
  ComponentProps<typeof Button>,
  "children" | "isIconOnly"
> {
  "aria-label": string
  icon: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, ...props }, ref) => (
    <Button isIconOnly ref={ref} {...props}>
      {icon}
    </Button>
  ),
)
