"use client"

import type { PropsWithChildren } from "react"
import { LinkComponentProvider } from "@opengovsg/isomer-components"
import Link from "next/link"

export const IsomerProviders = ({ children }: PropsWithChildren) => (
  <LinkComponentProvider value={Link}>{children}</LinkComponentProvider>
)
