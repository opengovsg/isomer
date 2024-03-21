import type { IsomerPageSchema } from "~/engine"
import { renderComponent } from "../render"

export const Skeleton = ({
  site,
  page,
  LinkComponent,
  children,
}: React.PropsWithChildren<
  Pick<IsomerPageSchema, "site" | "page" | "LinkComponent">
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
    <html lang={page.language || "en"} data-theme={`isomer-${site.theme}`}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, user-scalable=yes, initial-scale=1.0"
        />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />

        <meta property="og:title" content={page.title} />
        {page.noIndex && <meta name="robots" content="noindex" />}

        <title>{page.title}</title>
      </head>
      <body>
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
      </body>
    </html>
  )
}
