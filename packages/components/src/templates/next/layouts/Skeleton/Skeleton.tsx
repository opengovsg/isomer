import type { IsomerPageSchemaType } from "~/engine"
import {
  DatadogRum,
  Footer,
  GoogleTagManagerBody,
  GoogleTagManagerHeader,
  Masthead,
  Navbar,
  Notification,
  SkipToContent,
  UnsupportedBrowserBanner,
  Wogaa,
} from "../../components/internal"
import { SKIP_TO_CONTENT_ANCHOR_ID } from "../../constants"

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

  const shouldIncludeGTM =
    site.environment === "production" &&
    (!!site.siteGtmId || !!site.isomerGtmId)

  return (
    <>
      {shouldIncludeGTM && (
        <GoogleTagManagerHeader
          siteGtmId={site.siteGtmId}
          isomerGtmId={site.isomerGtmId}
          ScriptComponent={ScriptComponent}
        />
      )}

      {site.isGovernment && <Wogaa ScriptComponent={ScriptComponent} />}

      {!isStaging && <DatadogRum />}

      <header>
        <SkipToContent LinkComponent={LinkComponent} />

        {site.isGovernment && <Masthead isStaging={isStaging} />}

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
      </header>

      <main
        id={SKIP_TO_CONTENT_ANCHOR_ID}
        tabIndex={-1}
        className="focus-visible:outline-none"
      >
        {children}
      </main>

      <Footer
        isGovernment={site.isGovernment}
        siteName={site.siteName}
        agencyName={site.agencyName || site.siteName}
        lastUpdated={site.lastUpdated}
        site={site}
        LinkComponent={LinkComponent}
        {...site.footerItems}
      />

      {/* needs to be the last element in the body */}
      {shouldIncludeGTM && (
        <GoogleTagManagerBody
          siteGtmId={site.siteGtmId}
          isomerGtmId={site.isomerGtmId}
        />
      )}
    </>
  )
}
