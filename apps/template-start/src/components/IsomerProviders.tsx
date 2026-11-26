"use client"

import type { ComponentProps, PropsWithChildren } from "react"
import { LinkComponentProvider } from "@opengovsg/isomer-components"
import { Link } from "@tanstack/react-router"

const IsomerLink = (props: ComponentProps<typeof Link>) => (
  <Link {...props} preload={false} />
)

export const IsomerProviders = ({ children }: PropsWithChildren) => (
  <LinkComponentProvider value={IsomerLink}>{children}</LinkComponentProvider>
)
