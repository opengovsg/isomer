import type { IsomerPageSchemaType } from "~/engine"
import {
  Footer,
  Masthead,
  Navbar,
  Notification,
  ScrollToTop,
  SkipToContent,
  UnsupportedBrowserBanner,
} from "../../components/internal"
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
