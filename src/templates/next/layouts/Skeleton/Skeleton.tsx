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

  return (
    <html lang={site.language} data-theme={`isomer-${site.theme}`}>
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
            logo: {
              url: site.logoUrl,
              alt: site.siteName,
            },
            links: [],
          },
          LinkComponent,
        })}

        {children}

        {renderComponent({
          component: {
            type: "footer",
            agencyName: site.siteName,
            lastUpdated: new Date().toISOString(),
            items: [],
          },
          LinkComponent,
        })}
      </body>
    </html>
  )
}
