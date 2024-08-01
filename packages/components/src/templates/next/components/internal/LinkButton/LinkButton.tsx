"use client"

import type { LinkProps as AriaLinkProps } from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { Link as AriaLink, composeRenderProps } from "react-aria-components"

import { buttonStyles } from "../Button"

export interface LinkButtonProps
  extends AriaLinkProps,
    VariantProps<typeof buttonStyles> {}

/**
 * Link that looks like a button.
 */
export default function LinkButton({
  className,
  variant,
  size,
  colorScheme,
  ...props
}: LinkButtonProps) {
  return (
    <AriaLink
      {...props}
      className={composeRenderProps(className, (className, renderProps) =>
        buttonStyles({ ...renderProps, variant, size, className, colorScheme }),
      )}
    />
  )
}
