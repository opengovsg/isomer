import { type NotFoundPageSchemaType } from "~/engine"
import { getTailwindVariantLayout } from "~/utils"
import { createInfobarStyles } from "../../components/complex/Infobar"
import { LinkButton } from "../../components/internal/LinkButton"
import { Skeleton } from "../Skeleton"
import { NotFoundSearchButton } from "./NotFoundSearchButton"

const NotFoundLayout = ({
  site,
  page,
  layout,
  LinkComponent,
}: NotFoundPageSchemaType) => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const infobarStyles = createInfobarStyles({
    layout: simplifiedLayout,
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
                  This page might have been moved or deleted. Try searching for
                  this page instead.
                </p>
              </div>
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

export default NotFoundLayout
