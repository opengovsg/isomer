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
  children,
}: React.PropsWithChildren<
  Pick<IsomerPageSchemaType, "site" | "page" | "layout">
>) => {
  const isStaging = site.environment === "staging"

  return (
    <>
      <ScrollToTop />

      <header>
        <SkipToContent />

        {site.isGovernment && <Masthead isStaging={isStaging} />}

        {site.notification?.title && (
          <Notification {...site.notification} site={site} />
        )}

        <UnsupportedBrowserBanner />

        <Navbar
          logoUrl={site.logoUrl}
          logoAlt={site.siteName}
          layout={layout}
          search={
            // Navbar only renders LocalSearch + SearchSG input boxes.
            // Egazette Algolia search lives on its own page, not in the navbar.
            site.search?.type === "egazette-algolia" ? undefined : site.search
          }
          {...site.navbar}
          site={site}
        />
      </header>

      <main
        id={SKIP_TO_CONTENT_ANCHOR_ID}
        tabIndex={-1}
        className="focus-visible:outline-none"
      >
        {site.enablePolyglot && <Polyglot environment={site.environment} />}
        {children}
      </main>

      <Footer
        isGovernment={site.isGovernment}
        siteName={site.siteName}
        agencyName={site.agencyName || site.siteName}
        lastUpdated={site.lastUpdated}
        site={site}
        {...site.footerItems}
      />
    </>
  )
}
