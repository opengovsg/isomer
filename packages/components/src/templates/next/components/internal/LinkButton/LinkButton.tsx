"use client"

import type { ElementType } from "react"
import type { VariantProps } from "tailwind-variants"

import type { LinkProps } from "~/interfaces"
import { twMerge } from "~/lib/twMerge"
import { isExternalUrl } from "~/utils"
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
  const href = props.href
  const isExternalLink = !!href && isExternalUrl(props.href)

  return (
    <Link
      {...props}
      className={twMerge(
        buttonStyles({ variant, size, className, colorScheme }),
        className,
      )}
      isExternal={isExternalLink}
      showExternalIcon={isExternalLink}
    />
  )
}
