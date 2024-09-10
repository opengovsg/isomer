import type { IsomerPageSchemaType } from "~/engine"
import {
  Footer,
  Masthead,
  Navbar,
  Notification,
} from "../../components/internal"

export const Skeleton = ({
  site,
  layout,
  LinkComponent,
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
      {site.notification && (
        <Notification
          {...site.notification}
          LinkComponent={LinkComponent}
          site={site}
        />
      )}
      <Navbar
        logoUrl={site.logoUrl}
        logoAlt={site.siteName}
        layout={layout}
        search={site.search}
        items={site.navBarItems}
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
