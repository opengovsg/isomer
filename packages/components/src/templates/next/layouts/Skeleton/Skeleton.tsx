import type { IsomerPageSchemaType } from "~/engine"
import {
  Footer,
  Masthead,
  Navbar,
  Notification,
  UnsupportedBrowserBanner,
  Wogaa,
} from "../../components/internal"

export const Skeleton = ({
  site,
  layout,
  LinkComponent,
  ScriptComponent,
  children,
}: React.PropsWithChildren<
  Pick<
    IsomerPageSchemaType,
    "site" | "page" | "layout" | "LinkComponent" | "ScriptComponent"
  >
>) => {
  const isStaging = site.environment === "staging"

  return (
    <>
      {site.isGovernment && <Masthead isStaging={isStaging} />}

      {site.isGovernment && <Wogaa ScriptComponent={ScriptComponent} />}

      {site.notification && (
        <Notification
          {...site.notification}
          LinkComponent={LinkComponent}
          site={site}
        />
      )}

      <UnsupportedBrowserBanner />

      <Navbar
        logoUrl={site.logoUrl}
        logoAlt={site.siteName}
        layout={layout}
        search={site.search}
        items={site.navBarItems}
        site={site}
        LinkComponent={LinkComponent}
      />

      {children}

      <Footer
        isGovernment={site.isGovernment}
        siteName={site.siteName}
        agencyName={site.agencyName || site.siteName}
        lastUpdated={site.lastUpdated}
        LinkComponent={LinkComponent}
        {...site.footerItems}
      />
    </>
  )
}
