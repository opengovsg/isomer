import type { VariantProps } from "tailwind-variants"

import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { buttonIconStyles, buttonStyles } from "../Button/common"

interface GetButtonClassNamesProps {
  variant: VariantProps<typeof buttonStyles>["variant"]
  colorScheme: VariantProps<typeof buttonStyles>["colorScheme"]
  size: VariantProps<typeof buttonStyles>["size"]
  className?: string
}

export const getButtonClassNames = ({
  variant,
  colorScheme,
  size,
  className = "",
}: GetButtonClassNamesProps) => {
  const baseConfig = { variant, colorScheme, size }

  const base = buttonStyles(baseConfig)
  const disabled = buttonStyles({
    ...baseConfig,
    isDisabled: true,
  })
  const focusVisible = buttonStyles({ ...baseConfig, isFocusVisible: true })
  const disabledAndFocusVisible = buttonStyles({
    ...baseConfig,
    isDisabled: true,
    isFocusVisible: true,
  })

  return {
    base: twMerge(base, className),
    disabled: twMerge(disabled, className),
    focusVisible: twMerge(focusVisible, className),
    disabledAndFocusVisible: twMerge(disabledAndFocusVisible, className),
  }
}

const downloadIconStyles = tv({
  extend: buttonIconStyles,
  variants: {
    isLoading: {
      true: "animate-spin",
    },
  },
})

interface GetIconClassNamesProps {
  size: VariantProps<typeof downloadIconStyles>["size"]
}
export const getIconClassNames = ({ size }: GetIconClassNamesProps) => {
  return {
    base: downloadIconStyles({ size }),
    loading: downloadIconStyles({ size, isLoading: true }),
  }
}
