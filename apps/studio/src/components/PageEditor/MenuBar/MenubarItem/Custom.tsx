/* oxlint-disable import/newline-after-import -- studio lint cleanup */
import { isNullableBooleanTrue } from "~/utils/truthiness"
export interface MenubarCustomProps {
  type: "custom"
  render: () => React.ReactNode
  isHidden?: () => boolean
}

export const MenubarCustom = ({
  isHidden,
  render,
}: MenubarCustomProps): React.ReactNode | null => {
  if (isNullableBooleanTrue(isHidden?.())) {
    return null
  }
  return render()
}
