"use client"

// React 19 / Next.js 16 forbids passing functions as props across the
// server→client boundary (they are not serializable). LinkComponent is a
// React component (function), so it cannot be forwarded via props from a
// Server Component down to any "use client" leaf. Instead, the consuming app
// wraps its tree with LinkComponentProvider (a Client Component that imports
// the framework's Link directly), and client components read it via
// useLinkComponent() — keeping the function entirely within the client module
// graph and never touching the serialisation boundary.
import type { LinkComponentType } from "~/types"
import { createContext, useContext } from "react"

const LinkComponentContext = createContext<LinkComponentType>("a")

export const LinkComponentProvider = ({
  children,
  value = "a",
}: {
  children: React.ReactNode
  value?: LinkComponentType
}) => (
  <LinkComponentContext.Provider value={value}>
    {children}
  </LinkComponentContext.Provider>
)

export const useLinkComponent = (): LinkComponentType =>
  useContext(LinkComponentContext)
