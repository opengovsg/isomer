import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { focusVisibleHighlight } from "~/utils/rac"

export const mastheadButtonStyle = tv({
  extend: focusVisibleHighlight,
  base: "",
})

interface GetMastheadButtonClassNamesProps {
  baseClassName?: string
}

export const getMastheadButtonClassNames = ({
  baseClassName = "",
}: GetMastheadButtonClassNamesProps = {}) => {
  const base = mastheadButtonStyle()
  const focusVisible = mastheadButtonStyle({ isFocusVisible: true })

  return {
    base: twMerge(baseClassName, base),
    focusVisible: twMerge(baseClassName, focusVisible),
  }
}
