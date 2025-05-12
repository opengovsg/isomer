import type { HeroProps } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import { LinkButton } from "../../internal/LinkButton/LinkButton"

export const HeroFloating = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  site,
  LinkComponent,
  theme = "default",
}: HeroProps) => {
  const backgroundSrc =
    isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
      ? backgroundUrl
      : `${site.assetsBaseUrl}${backgroundUrl}`

  return (
    <section className="flex w-full flex-col items-center">
      {/* Image with aspect ratio and max height */}
      <div
        className="aspect-square max-h-[960px] w-full bg-cover bg-center sm:aspect-[2/1]"
        style={{ backgroundImage: `url('${backgroundSrc}')` }}
      />
      {/* Text container */}
      <div className="relative z-10 mx-auto -mt-16 w-full max-w-[896px] px-6 sm:-mt-24 md:px-10">
        <div
          className={`flex flex-col items-center gap-6 rounded-xl bg-white/90 py-12 shadow-lg backdrop-blur-sm sm:py-16`}
        >
          <h1 className="prose-display-xl break-words text-center">{title}</h1>
          {subtitle && (
            <p className="prose-title-lg-regular text-center">{subtitle}</p>
          )}
          {buttonLabel && buttonUrl && (
            <div className="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row">
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
      </div>
    </section>
  )
}
