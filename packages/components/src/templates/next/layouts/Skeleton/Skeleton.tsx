import type { IsomerPageSchemaType } from "~/engine"
import {
  DatadogRum,
  FontPreload,
  Footer,
  GoogleTagManagerBody,
  GoogleTagManagerHeader,
  GoogleTagManagerPreload,
  IsoFluent,
  Masthead,
  Navbar,
  Notification,
  ScrollToTop,
  SkipToContent,
  UnsupportedBrowserBanner,
  VicaStylesheet,
  VicaWidget,
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
      <FontPreload />

      {shouldIncludeGTM && (
        <>
          <GoogleTagManagerPreload />
          <GoogleTagManagerHeader
            siteGtmId={site.siteGtmId}
            isomerGtmId={site.isomerGtmId}
            ScriptComponent={ScriptComponent}
          />
        </>
      )}

      {site.isGovernment && <Wogaa ScriptComponent={ScriptComponent} />}
      {site.isofluent && <IsoFluent ScriptComponent={ScriptComponent} />}

      {!isStaging && <DatadogRum />}

      {site.vica && <VicaStylesheet />}

      <ScrollToTop />

      <header>
        <SkipToContent LinkComponent={LinkComponent} />
        <div id="isofluent-switcher"></div>
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

      {shouldIncludeGTM && (
        <GoogleTagManagerBody
          siteGtmId={site.siteGtmId}
          isomerGtmId={site.isomerGtmId}
        />
      )}

      {/* Ensures that the webchat widget only loads after the page has loaded */}
      {site.vica && <VicaWidget {...site.vica} />}
    </>
  )
}
