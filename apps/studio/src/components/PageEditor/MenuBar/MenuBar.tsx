import type { Editor } from "@tiptap/react"
import { HStack } from "@chakra-ui/react"

import type { PossibleMenubarItemProps } from "./MenubarItem/types"
import { MenubarItemFactory } from "./MenubarItem"

export type EditorMenuBar = ({ editor }: { editor: Editor }) => JSX.Element

export const MenuBar = ({ items }: { items: PossibleMenubarItemProps[] }) => {
  return (
    <HStack
      bgColor="base.canvas.alt"
      flex="0 0 auto"
      flexWrap="wrap"
      pl="0.75rem"
      pr="0.25rem"
      py="0.5rem"
      w="100%"
      borderBottom="1px solid"
      borderColor="base.divider.medium"
      borderTopRadius="0.25rem"
      spacing="0.25rem"
    >
      {items.map((item, index) => (
        <MenubarItemFactory key={index} {...item} />
      ))}
    </HStack>
  )
}
