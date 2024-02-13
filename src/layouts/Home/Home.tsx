import { useEffect, useState } from "react"
import { IsomerBaseSchema, RenderEngine } from "../../engine/render"

export interface HomeLayoutProps {
  navbar: IsomerBaseSchema
  footer: IsomerBaseSchema

  LinkComponent: any
  children: React.ReactNode
}
export const HomeLayout = ({
  navbar,
  footer,
  LinkComponent,
  children,
}: HomeLayoutProps) => {
  return (
    <>
      <RenderEngine
        id={navbar.id}
        components={navbar.components}
        LinkComponent={LinkComponent}
      />
      {children}
      <RenderEngine
        id={footer.id}
        components={footer.components}
        LinkComponent={LinkComponent}
      />
    </>
  )
}

export default HomeLayout
