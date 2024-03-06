import { Header, SidePane } from "../../classic/components"
import { IsomerBaseSchema, Sitemap, RenderEngine } from "../../engine/render"

export interface ContentLayoutProps {
  navbar: IsomerBaseSchema
  footer: IsomerBaseSchema
  sitemap?: Sitemap
  permalink?: string
  children: React.ReactNode
  LinkComponent: any
}
export const ContentLayout = ({
  navbar,
  footer,
  permalink,
  sitemap,
  children,
  LinkComponent,
}: ContentLayoutProps) => {
  return (
    <>
      <RenderEngine
        id={navbar.id}
        components={navbar.components}
        LinkComponent={LinkComponent}
      />
      {permalink && sitemap && (
        <Header permalink={permalink} sitemap={sitemap} />
      )}
      <div className="flex container py-5">
        {sitemap && permalink && (
          <SidePane sitemap={sitemap} currentPermalink={permalink} />
        )}
        <div className="px-5 py-3">{children}</div>
      </div>
      <RenderEngine
        id={footer.id}
        components={footer.components}
        LinkComponent={LinkComponent}
      />
    </>
  )
}

export default ContentLayout
