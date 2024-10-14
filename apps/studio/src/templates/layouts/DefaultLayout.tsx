import { type ReactNode } from "react"
import { chakra } from "@chakra-ui/react"

import { LayoutHead } from "~/components/LayoutHead"

interface DefaultLayoutProps {
  children: ReactNode
}

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <LayoutHead />
      <chakra.main display="flex" flex={1}>
        {children}
      </chakra.main>
    </>
  )
}
