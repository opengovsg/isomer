import type { PropsWithChildren } from "react"

interface BaseLinkProps {
  href?: string
  current?: string | boolean
  isDisabled?: boolean
  isExternal?: boolean
  isWithFocusVisibleHighlight?: boolean
  showExternalIcon?: boolean
  className?: string
  label?: string
  onClick?: () => void
}

export type LinkProps = PropsWithChildren<BaseLinkProps>
