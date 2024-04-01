import type { IsomerPageSchema } from "~/engine"
import { renderComponent } from "../render"

export const Skeleton = ({
  site,
  page,
  LinkComponent,
  HeadComponent,
  children,
}: React.PropsWithChildren<
  Pick<IsomerPageSchema, "site" | "page" | "HeadComponent" | "LinkComponent">
>) => {
  const isStaging = site.environment === "staging"

  return (
    <>
      {renderComponent({
        component: {
          type: "metahead",
          title: page.title || site.siteName,
          description: page.description,
          noIndex: page.noIndex,
          favicon: site.favicon,
          HeadComponent,
        },
      })}
      {site.isGovernment &&
        renderComponent({
          component: { type: "masthead", isStaging },
          LinkComponent,
        })}

      {renderComponent({
        component: {
          type: "navbar",
          logoUrl: site.logoUrl,
          logoAlt: site.siteName,
          search: {
            type: "localSearch",
            searchUrl: "/search",
          },
          items: site.navBarItems,
        },
        LinkComponent,
      })}

      {children}

      {renderComponent({
        component: {
          type: "footer",
          isGovernment: site.isGovernment,
          siteName: site.siteName,
          agencyName: site.agencyName || site.siteName,
          lastUpdated: site.lastUpdated,
          ...site.footerItems,
        },
        LinkComponent,
      })}
    </>
  )
}
