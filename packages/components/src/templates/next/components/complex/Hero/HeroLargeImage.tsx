import type { HeroProps } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { LinkButton } from "../../internal/LinkButton/LinkButton"
import { ImageClient } from "../Image"

export const HeroLargeImage = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  site,
  LinkComponent,
}: HeroProps) => {
  const backgroundSrc =
    isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
      ? backgroundUrl
      : `${site.assetsBaseUrl}${backgroundUrl}`

  return (
    <section className="flex w-full flex-col">
      {/* Text and button container */}
      <div
        className={`mx-auto flex w-full flex-col gap-6 px-6 pb-12 pt-10 md:gap-9 lg:pb-16 lg:pt-12 ${ComponentContent}`}
      >
        {/* Text container */}
        <div className="flex flex-col items-center gap-5 text-base-content-strong sm:items-start md:gap-6 md:text-center lg:mx-auto lg:max-w-[66.67%]">
          <h1 className="prose-display-xl w-full">{title}</h1>
          {subtitle && (
            <p className="prose-title-lg-regular w-full">{subtitle}</p>
          )}
        </div>
        {/* Button container */}
        {buttonLabel && buttonUrl && (
          <div className="flex flex-col items-start justify-center gap-x-5 gap-y-4 md:flex-row md:items-center">
            <LinkButton
              href={getReferenceLinkHref(
                buttonUrl,
                site.siteMap,
                site.assetsBaseUrl,
              )}
              size="lg"
              LinkComponent={LinkComponent}
              isWithFocusVisibleHighlight
            >
              {buttonLabel}
            </LinkButton>
            {secondaryButtonLabel && secondaryButtonUrl && (
              <LinkButton
                variant="outline"
                size="lg"
                href={getReferenceLinkHref(
                  secondaryButtonUrl,
                  site.siteMap,
                  site.assetsBaseUrl,
                )}
                LinkComponent={LinkComponent}
                isWithFocusVisibleHighlight
              >
                {secondaryButtonLabel}
              </LinkButton>
            )}
          </div>
        )}
      </div>
      <ImageClient
        src={backgroundSrc}
        alt={title}
        width="100%"
        className="aspect-square max-h-[60rem] w-full object-fill md:aspect-[2/1]"
        lazyLoading={false}
      />
    </section>
  )
}
