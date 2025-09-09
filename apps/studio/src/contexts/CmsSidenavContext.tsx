import type { UseDisclosureReturn } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"
import { createContext, useContext } from "react"

export interface CmsSidenavContextType {
  isSidenavOpen: UseDisclosureReturn["isOpen"]
  onSidenavClose: UseDisclosureReturn["onClose"]
}

const CmsSidenavContext = createContext<CmsSidenavContextType | null>(null)

export const CmsSidenavContextProvider = ({
  isSidenavOpen,
  onSidenavClose,
  children,
}: PropsWithChildren<CmsSidenavContextType>) => {
  return (
    <CmsSidenavContext.Provider value={{ isSidenavOpen, onSidenavClose }}>
      {children}
    </CmsSidenavContext.Provider>
  )
}

export const useCmsSidenavContext = () => {
  const cmsSidenavContext = useContext(CmsSidenavContext)

  if (!cmsSidenavContext) {
    throw new Error(
      "useCmsSidenavContext must be used within an CmsSidenavContextProvider",
    )
  }

  return cmsSidenavContext
}
