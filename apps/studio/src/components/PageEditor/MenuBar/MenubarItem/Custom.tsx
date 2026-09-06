export interface MenubarCustomProps {
  type: "custom"
  render: () => React.ReactNode
  isHidden?: () => boolean
}

export const MenubarCustom = ({
  isHidden,
  render,
}: MenubarCustomProps): React.ReactNode | null => {
  if (isHidden?.()) {
    return null
  }
  return render()
}
