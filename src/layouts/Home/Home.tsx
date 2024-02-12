import { IsomerBaseSchema, RenderEngine } from "../../engine/render"

export interface DefaultLayoutProps {
  navbar: IsomerBaseSchema
  footer: IsomerBaseSchema
  children: React.ReactNode
}
export const HomeLayout = ({
  navbar,
  footer,
  children,
}: DefaultLayoutProps) => {
  return (
    <>
      <RenderEngine id={navbar.id} components={navbar.components} />
      {children}
      <RenderEngine id={footer.id} components={footer.components} />
    </>
  )
}

export default HomeLayout
