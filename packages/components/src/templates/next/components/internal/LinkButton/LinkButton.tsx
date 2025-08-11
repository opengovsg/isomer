"use client"

import type { ElementType } from "react"
import type { VariantProps } from "tailwind-variants"
import { BiLinkExternal } from "react-icons/bi"

import type { LinkProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { isExternalUrl } from "~/utils"
import { buttonStyles } from "../Button"
import { Link } from "../Link"

// External link icon styling
const externalIconStyles = tv({
  base: "h-auto flex-shrink-0",
  variants: {
    size: {
      sm: "w-3.5 lg:w-4",
      base: "w-3.5 lg:w-4",
      lg: "w-4.5 lg:w-5",
    },
  },
  defaultVariants: {
    size: "base",
  },
})

// Link button layout styling
const linkButtonStyles = tv({
  base: "",
  variants: {
    isExternal: {
      true: "flex items-center gap-2",
    },
  },
})

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

  if (isExternalLink) {
    return (
      <Link
        {...props}
        className={twMerge(
          buttonStyles({ variant, size, className, colorScheme }),
          linkButtonStyles({ isExternal: true }),
          className,
        )}
        isExternal={isExternalLink}
      >
        {props.children}
        <BiLinkExternal className={externalIconStyles({ size })} />
      </Link>
    )
  }

  return (
    <Link
      {...props}
      className={twMerge(
        buttonStyles({ variant, size, className, colorScheme }),
        className,
      )}
    />
  )
}
