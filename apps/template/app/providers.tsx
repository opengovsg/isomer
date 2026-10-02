"use client"

import type { ComponentProps, PropsWithChildren } from "react"
import { LinkComponentProvider } from "@opengovsg/isomer-components"
import Link from "next/link"

// Next 16 segment-prefetch requests __next.*.txt RSC files our static export never emits,
// so every prefetch 404s. Disabling prefetch stops those requests at the source.
const NoPrefetchLink = (props: ComponentProps<typeof Link>) => (
  <Link {...props} prefetch={false} />
)

export const IsomerProviders = ({ children }: PropsWithChildren) => (
  <LinkComponentProvider value={NoPrefetchLink}>
    {children}
  </LinkComponentProvider>
)
