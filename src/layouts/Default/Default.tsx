import { Header } from "../../templates/classic/components"
import { IsomerBaseSchema, Sitemap, RenderEngine } from "../../engine/render"

export interface DefaultLayoutProps {
  navbar: IsomerBaseSchema
  footer: IsomerBaseSchema
  sitemap?: Sitemap
  permalink?: string
  children: React.ReactNode
  LinkComponent: any
}
export const DefaultLayout = ({
  navbar,
  footer,
  permalink,
  sitemap,
  children,
  LinkComponent,
}: DefaultLayoutProps) => {
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
      {children}
      <RenderEngine
        id={footer.id}
        components={footer.components}
        LinkComponent={LinkComponent}
      />
    </>
  )
}

export default DefaultLayout
