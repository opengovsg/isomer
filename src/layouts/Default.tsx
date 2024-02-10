import { RenderEngine } from ".."
import { IsomerBaseSchema } from "../engine/render"

export interface DefaultLayoutProps {
  navbar: IsomerBaseSchema
  footer: IsomerBaseSchema
  children: React.ReactNode
}
export const DefaultLayout = ({
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

export default DefaultLayout
