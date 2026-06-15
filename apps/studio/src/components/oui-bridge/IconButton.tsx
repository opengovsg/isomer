import type { ComponentProps, ReactNode } from "react"
import { Button } from "@opengovsg/oui"

/**
 * Bridge for design-system-react's `IconButton`, which OUI has no component for (only
 * `Button isIconOnly`). Keeps the DS API: an `icon` element + required `aria-label`,
 * rendered as an OUI icon-only Button.
 */
interface IconButtonProps extends Omit<
  ComponentProps<typeof Button>,
  "children" | "isIconOnly"
> {
  "aria-label": string
  icon: ReactNode
}

export const IconButton = ({ icon, ...props }: IconButtonProps) => (
  <Button isIconOnly {...props}>
    {icon}
  </Button>
)
