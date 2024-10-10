import type { PropsWithChildren } from "react"

import type { LinkComponentType } from "~/types"

interface BaseLinkProps {
  href?: string
  current?: string | boolean
  isDisabled?: boolean
  isExternal?: boolean
  isWithFocusVisibleHighlight?: boolean
  showExternalIcon?: boolean
  className?: string
  label?: string
  LinkComponent?: LinkComponentType
}

export type LinkProps = PropsWithChildren<BaseLinkProps>
