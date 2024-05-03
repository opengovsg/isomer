import type { IsomerPageSchema } from "~/engine"
import {
  Footer,
  Masthead,
  Navbar,
  Notification,
} from "../../components/internal"

export const Skeleton = ({
  site,
  page,
  LinkComponent,
  ScriptComponent,
  children,
}: React.PropsWithChildren<
  Pick<IsomerPageSchema, "site" | "page" | "LinkComponent" | "ScriptComponent">
>) => {
  const isStaging = site.environment === "staging"

  return (
    <>
      {site.isGovernment && (
        <Masthead isStaging={isStaging} LinkComponent={LinkComponent} />
      )}

      {site.notification && <Notification content={site.notification} />}

      <Navbar
        logoUrl={site.logoUrl}
        logoAlt={site.siteName}
        search={site.search}
        items={site.navBarItems}
        LinkComponent={LinkComponent}
        ScriptComponent={ScriptComponent}
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
