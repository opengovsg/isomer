import type { Editor } from "@tiptap/react"
import { HStack } from "@chakra-ui/react"
import { useMemo } from "react"

import type { PossibleMenubarItemProps } from "./MenubarItem/types"
import { MenubarItemFactory } from "./MenubarItem"

export type EditorMenuBar = ({ editor }: { editor: Editor }) => React.ReactNode

const withMenubarItemKeys = (items: PossibleMenubarItemProps[]) => {
  const typeCounts = new Map<string, number>()

  return items.map((item) => {
    if ("title" in item && item.title) {
      return { item, key: `${item.type}-${item.title}` }
    }

    const typeCount = typeCounts.get(item.type) ?? 0
    typeCounts.set(item.type, typeCount + 1)
    return { item, key: `${item.type}-${typeCount}` }
  })
}

export const MenuBar = ({ items }: { items: PossibleMenubarItemProps[] }) => {
  const itemsWithKeys = useMemo(() => withMenubarItemKeys(items), [items])

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
      {itemsWithKeys.map(({ item, key }) => (
        <MenubarItemFactory key={key} {...item} />
      ))}
    </HStack>
  )
}
