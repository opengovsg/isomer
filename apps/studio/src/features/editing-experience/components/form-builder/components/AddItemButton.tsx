import type { ButtonProps } from "@opengovsg/design-system-react"
import { Button } from "@opengovsg/design-system-react"
import { BiPlusCircle } from "react-icons/bi"

export const AddItemButton = ({
  children,
  ...rest
}: Omit<ButtonProps, "leftIcon" | "size" | "variant">) => {
  return (
    <Button
      variant="clear"
      size="xs"
      leftIcon={<BiPlusCircle fontSize="1.25rem" />}
      flexShrink={0}
      {...rest}
    >
      {children}
    </Button>
  )
}
