import { Header } from "../../classic/components"
import { IsomerBaseSchema, Sitemap, RenderEngine } from "../../engine/render"

export interface DefaultLayoutProps {
  navbar: IsomerBaseSchema
  footer: IsomerBaseSchema
  sitemap?: Sitemap
  permalink?: string
  children: React.ReactNode
}
export const DefaultLayout = ({
  navbar,
  footer,
  permalink,
  sitemap,
  children,
}: DefaultLayoutProps) => {
  return (
    <>
      <RenderEngine id={navbar.id} components={navbar.components} />
      {permalink && sitemap && (
        <Header permalink={permalink} sitemap={sitemap} />
      )}
      {children}
      <RenderEngine id={footer.id} components={footer.components} />
    </>
  )
}

export default DefaultLayout
