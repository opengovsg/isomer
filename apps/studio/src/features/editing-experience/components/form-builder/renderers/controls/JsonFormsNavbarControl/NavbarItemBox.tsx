/* oxlint-disable unicorn/no-useless-undefined -- JSON Forms handleChange requires explicit undefined */
/* oxlint-disable unicorn/prefer-export-from -- core cleanup deferred */
import type { NavbarItemBoxDragPresentation } from "./NavbarItemBoxBody"
import { NavbarItemBoxBody } from "./NavbarItemBoxBody"
import { useNavbarItemSubItemDrag } from "./useNavbarItemSubItemDrag"

interface NavbarItemBoxProps {
  index: number
  onEditItem: () => void
  onDeleteItem: () => void
  name?: string
  description?: string
  subItems?: Pick<NavbarItemBoxProps, "name" | "description">[]
  parentIndex?: number
  itemDragHandleRef?: React.RefObject<HTMLDivElement>
  dragPresentation: NavbarItemBoxDragPresentation
}

export const NavbarItemBox = ({
  index,
  onEditItem,
  onDeleteItem,
  name,
  description,
  subItems,
  parentIndex,
  itemDragHandleRef,
  dragPresentation,
}: NavbarItemBoxProps) => {
  const {
    itemRef,
    itemDefaultDragHandleRef,
    isSubItemDragging,
    navbarItemClosestEdge,
  } = useNavbarItemSubItemDrag({
    index,
    isSubItem: dragPresentation.isSubItem,
    parentIndex,
  })

  return (
    <NavbarItemBoxBody
      index={index}
      parentIndex={parentIndex}
      name={name}
      description={description}
      subItems={subItems}
      itemDragHandleRef={itemDragHandleRef}
      itemRef={itemRef}
      itemDefaultDragHandleRef={itemDefaultDragHandleRef}
      isSubItemDragging={isSubItemDragging}
      navbarItemClosestEdge={navbarItemClosestEdge}
      dragPresentation={dragPresentation}
      onEditItem={onEditItem}
      onDeleteItem={onDeleteItem}
    />
  )
}

export type { NavbarItemBoxDragPresentation }
