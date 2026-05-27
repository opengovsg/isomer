"use client"

import type { ElementType, ReactNode } from "react"
import { LinkComponentProvider } from "@opengovsg/isomer-components"
import { Link as WakuLink } from "waku/router/client"

// Waku's Link uses `to` instead of `href`. This adapter maps the standard
// `href` prop (used by isomer-components internally) to Waku's `to` prop for
// intra-site links, while keeping a plain <a> for external URLs.
const IsomerLink = ({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  if (href && href.startsWith("/") && !href.startsWith("//")) {
    return (
      <WakuLink
        to={href as React.ComponentProps<typeof WakuLink>["to"]}
        {...props}
      >
        {children}
      </WakuLink>
    )
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}

export const IsomerProviders = ({ children }: { children?: ReactNode }) => (
  <LinkComponentProvider value={IsomerLink as ElementType}>
    {children}
  </LinkComponentProvider>
)
