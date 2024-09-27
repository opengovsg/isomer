import { Divider } from "@chakra-ui/react"

export interface MenubarDividerProps {
  type: "divider"
  isHidden?: () => boolean
}

export const MenubarDivider = ({
  isHidden,
}: MenubarDividerProps): JSX.Element | null => {
  if (isHidden?.()) {
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
