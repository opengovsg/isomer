import type { IsomerPageSchema } from "~/engine"
import { renderComponent } from "../render"

export const Skeleton = ({
  site,
  meta,
  LinkComponent,
  HeadComponent,
  children,
}: React.PropsWithChildren<
  Pick<IsomerPageSchema, "site" | "meta" | "HeadComponent" | "LinkComponent">
>) => {
  const isStaging = site.environment === "staging"
  const timeNow = new Date()
  const lastUpdated =
    timeNow.getDate().toString().padStart(2, "0") +
    " " +
    timeNow.toLocaleString("default", { month: "short" }) +
    " " +
    timeNow.getFullYear()

  return (
    <>
      {renderComponent({
        component: {
          type: "metahead",
          title: meta.title || site.siteName,
          description: meta.description,
          noIndex: meta.noIndex,
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
          lastUpdated,
          ...site.footerItems,
        },
        LinkComponent,
      })}
    </>
  )
}
