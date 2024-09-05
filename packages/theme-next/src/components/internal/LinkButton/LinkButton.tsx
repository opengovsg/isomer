"use client"

import type { ElementType } from "react"
import type { VariantProps } from "tailwind-variants"
import { composeRenderProps } from "react-aria-components"

import type { LinkProps } from "../Link"
import { buttonStyles } from "../Button"
import { Link } from "../Link"

export interface LinkButtonProps
  extends LinkProps,
    VariantProps<typeof buttonStyles> {
  LinkComponent?: ElementType
}

/**
 * Link that looks like a button.
 */
export const LinkButton = ({
  className,
  variant,
  size,
  colorScheme,
  ...props
}: LinkButtonProps) => {
  return (
    <Link
      {...props}
      className={composeRenderProps(className, (className, renderProps) =>
        buttonStyles({ ...renderProps, variant, size, className, colorScheme }),
      )}
    />
  )
}
