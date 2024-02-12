import { Header, SidePane } from "../../components"
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
      <div className="flex container py-5">
        {sitemap && permalink && (
          <SidePane sitemap={sitemap} currentPermalink={permalink} />
        )}
        <div className="px-5 py-3">{children}</div>
      </div>
      <RenderEngine id={footer.id} components={footer.components} />
    </>
  )
}

export default DefaultLayout
