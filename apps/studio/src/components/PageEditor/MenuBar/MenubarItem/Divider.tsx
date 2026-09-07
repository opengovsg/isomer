import { Divider } from "@chakra-ui/react"
import { isNullableBooleanTrue } from "~/utils/truthiness"

export interface MenubarDividerProps {
  type: "divider"
  isHidden?: () => boolean
}

export const MenubarDivider = ({
  isHidden,
}: MenubarDividerProps): React.ReactNode | null => {
  if (isNullableBooleanTrue(isHidden?.())) {
    return null
  }
  return (
    <Divider
      orientation="vertical"
      borderColor="base.divider.medium"
      h="1.25rem"
      mx="0.25rem"
    />
  )
}
