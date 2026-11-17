// Lets the host swap the element links render as (Studio passes a FakeLink that doesn't navigate).
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
