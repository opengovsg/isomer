import type { IsomerPageSchemaType } from "~/types"
import { Footer } from "../../components/internal/Footer"
import { Masthead } from "../../components/internal/Masthead"
import { Navbar } from "../../components/internal/Navbar"
import { Notification } from "../../components/internal/Notification"
import { Polyglot } from "../../components/internal/Polyglot"
import { ScrollToTop } from "../../components/internal/ScrollToTop"
import { SkipToContent } from "../../components/internal/SkipToContent"
import { UnsupportedBrowserBanner } from "../../components/internal/UnsupportedBrowserBanner"
import { SKIP_TO_CONTENT_ANCHOR_ID } from "../../constants"

export const Skeleton = ({
  site,
  layout,
  LinkComponent,
  children,
}: React.PropsWithChildren<
  Pick<IsomerPageSchemaType, "site" | "page" | "layout" | "LinkComponent">
>) => {
  const isStaging = site.environment === "staging"

  return (
    <>
      <ScrollToTop />
      {site.enablePolyglot && <Polyglot />}
      <header>
        <SkipToContent LinkComponent={LinkComponent} />
        {site.isGovernment && <Masthead isStaging={isStaging} />}
        {site.notification?.title && (
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
          {...site.navbar}
          site={site}
          LinkComponent={LinkComponent}
        />
      </header>

      <main
        id={SKIP_TO_CONTENT_ANCHOR_ID}
        tabIndex={-1}
        className="focus-visible:outline-none"
      >
        <div id="polyglot-widget"></div>
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
    </>
  )
}
