import type { ComponentProps } from "react"
import { Button } from "@opengovsg/oui"
import { BiPlusCircle } from "react-icons/bi"

export const AddItemButton = ({
  children,
  ...rest
}: Omit<
  ComponentProps<typeof Button>,
  "startContent" | "size" | "variant"
>) => {
  return (
    <Button
      variant="clear"
      size="xs"
      startContent={<BiPlusCircle fontSize="1.25rem" />}
      className="shrink-0"
      {...rest}
    >
      {children}
    </Button>
  )
}
