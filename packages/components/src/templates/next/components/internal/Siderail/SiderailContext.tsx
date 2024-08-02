import type { FC, PropsWithChildren } from "react"
import { createContext, useContext } from "react"

import type { SiderailProps } from "~/interfaces"

export type SiderailContextProps = Pick<SiderailProps, "LinkComponent">

export type SiderailContextReturn = SiderailContextProps

const SiderailContext = createContext<SiderailContextReturn | undefined>(
  undefined,
)

export const SiderailProvider: FC<PropsWithChildren<SiderailContextProps>> = ({
  children,
  ...props
}) => {
  return (
    <SiderailContext.Provider value={props}>
      {children}
    </SiderailContext.Provider>
  )
}

export const useSiderailContext = (): SiderailContextReturn => {
  const context = useContext(SiderailContext)
  if (!context) {
    throw new Error("useSiderailContext must be used within a SiderailProvider")
  }
  return context
}
