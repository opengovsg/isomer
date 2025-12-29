import { type NotFoundPageSchemaType } from "~/types"
import { getTailwindVariantLayout } from "~/utils"
import { createInfobarStyles } from "../../components/complex/Infobar"
import { Link } from "../../components/internal/Link"
import { LinkButton } from "../../components/internal/LinkButton"
import { Skeleton } from "../Skeleton"
import { NotFoundSearchButton } from "./NotFoundSearchButton"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"
import { getFuzzySitemapMatches } from "~/utils/getFuzzySitemapMatches"

export const NotFoundLayout = ({
  site,
  page,
  layout,
  LinkComponent,
}: NotFoundPageSchemaType) => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const infobarStyles = createInfobarStyles({
    layout: simplifiedLayout,
  })

  const fuzzySitemapMatches = getFuzzySitemapMatches({
    sitemap: getSitemapAsArray(site.siteMap),
    query: page.permalink,
  })

  return (
    // NOTE: This is taken from Infobar in components.
    // However, we duplicated it here so that we can set the
    // search button as a client component and avoid streaming over a
    // huge payload to our end user
    <Skeleton
      site={site}
      page={page}
      layout={layout}
      LinkComponent={LinkComponent}
    >
      <div
        // ComponentContent = "component-content" (customCssClass.ts) is imported by all Homepage components,
        // but cannot be used here as tailwind does not support dynamic class names
        className={`[&_.component-content]:mx-auto [&_.component-content]:max-w-screen-xl [&_.component-content]:px-6 [&_.component-content]:md:px-10`}
      >
        <section>
          <div className={infobarStyles.outerContainer()}>
            <div className={infobarStyles.innerContainer()}>
              <div className={infobarStyles.headingContainer()}>
                <h2 className={infobarStyles.title()}>Page not found</h2>
                <p className={infobarStyles.description()}>
                  {fuzzySitemapMatches.length > 0
                    ? "This page might have been moved or deleted. Did you mean one of these?"
                    : "This page might have been moved or deleted. Try searching for this page instead."}
                </p>
              </div>
              {fuzzySitemapMatches.length > 0 && (
                <ul className="flex flex-col gap-6">
                  {fuzzySitemapMatches.map((match) => (
                    <li key={match.item.entity.permalink}>
                      <Link
                        href={match.item.entity.permalink}
                        className="group flex flex-col gap-1 outline-0"
                        LinkComponent={LinkComponent}
                      >
                        <span className="prose-headline-lg-semibold text-base-content-strong underline-offset-4 group-hover:text-brand-canvas-inverse group-hover:underline">
                          {match.item.entity.title}
                        </span>
                        <span className="prose-body-sm text-base-content-subtle">
                          {match.item.entity.permalink}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className={infobarStyles.buttonContainer()}>
                <NotFoundSearchButton LinkComponent={LinkComponent} />
                <LinkButton
                  href="/"
                  size="lg"
                  variant="outline"
                  LinkComponent={LinkComponent}
                  isWithFocusVisibleHighlight
                >
                  Go to homepage
                </LinkButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Skeleton>
  )
}
