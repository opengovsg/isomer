export interface MenubarCustomProps {
  type: "custom"
  render: () => JSX.Element
  isHidden?: () => boolean
}

export const MenubarCustom = ({
  isHidden,
  render,
}: MenubarCustomProps): JSX.Element | null => {
  if (isHidden?.()) {
    return null
  }
  return render()
}
