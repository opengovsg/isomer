import type { IsomerPageSchema } from "~/engine"
import { renderComponent } from "../render"

export const Skeleton = ({
  site,
  page,
  LinkComponent,
  HeadComponent,
  ScriptComponent,
  children,
}: React.PropsWithChildren<
  Pick<
    IsomerPageSchema,
    "site" | "page" | "HeadComponent" | "LinkComponent" | "ScriptComponent"
  >
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
      {site.notification &&
        renderComponent({
          component: {
            type: "notification",
            content: site.notification,
          },
        })}
      {renderComponent({
        component: {
          type: "navbar",
          logoUrl: site.logoUrl,
          logoAlt: site.siteName,
          search: site.search,
          items: site.navBarItems,
        },
        LinkComponent,
        ScriptComponent,
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
