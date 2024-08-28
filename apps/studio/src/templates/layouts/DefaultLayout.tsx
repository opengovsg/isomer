import { type ReactNode } from "react"

import { LayoutHead } from "~/components/LayoutHead"

interface DefaultLayoutProps {
  children: ReactNode
}

export const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <LayoutHead />

      <main>{children}</main>
    </>
  )
}
