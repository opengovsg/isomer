"use client"

import type { VariantProps } from "tailwind-variants"
import { composeRenderProps } from "react-aria-components"
import { BiUpArrowAlt } from "react-icons/bi"

import type { LinkComponentType } from "~/types"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/rac"
import { Link } from "./Link"

const linkStyle = tv({
  extend: focusVisibleHighlight,
  base: "prose-body-base sticky top-8 my-8 inline-flex items-center text-link underline-offset-4 hover:underline",
})

interface BackToTopLinkProps extends VariantProps<typeof linkStyle> {
  className?: string
  LinkComponent?: LinkComponentType
}

export const BackToTopLink = ({
  className,
  LinkComponent,
}: BackToTopLinkProps): JSX.Element => {
  return (
    <Link
      href="#"
      className={composeRenderProps(className, (className, renderProps) =>
        linkStyle({ className, ...renderProps }),
      )}
      LinkComponent={LinkComponent}
    >
      <BiUpArrowAlt aria-hidden className="h-6 w-6" />
      Back to top
    </Link>
  )
}
