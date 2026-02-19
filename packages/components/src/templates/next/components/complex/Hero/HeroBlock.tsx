import type { HeroBlockProps } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import { LinkButton } from "../../internal/LinkButton/LinkButton"
import { ImageClient } from "../Image"

const HERO_THEME_MAPPINGS = {
  hero: {
    default: "bg-brand-canvas-inverse",
    inverse: "bg-brand-canvas-alt",
  },
  text: {
    default: "text-base-content-inverse",
    inverse: "text-base-content",
  },
  button: {
    default: "inverse",
    inverse: "default",
  },
} as const

export const HeroBlock = ({
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
}: HeroBlockProps) => {
  const backgroundSrc =
    isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
      ? backgroundUrl
      : `${site.assetsBaseUrl}${backgroundUrl}`

  const heroColour = HERO_THEME_MAPPINGS.hero[theme]
  const heroTextColour = HERO_THEME_MAPPINGS.text[theme]
  const heroButton = HERO_THEME_MAPPINGS.button[theme]

  return (
    <section className="flex min-h-[15rem] flex-col sm:min-h-[22.5rem] lg:min-h-[31.25rem] lg:flex-row">
      <div
        className={`flex flex-row ${heroColour} px-6 pb-12 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pl-10 lg:pr-8`}
      >
        <div
          className={`flex w-full max-w-[548px] flex-col justify-center gap-9 ${heroTextColour}`}
        >
          <div className="flex flex-col gap-6">
            <h1 className="wrap-break-word prose-display-xl text-balance">
              {title}
            </h1>
            {subtitle && <p className="prose-title-lg-regular">{subtitle}</p>}
          </div>
          {buttonLabel && buttonUrl && (
            <div className="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row">
              <LinkButton
                href={getReferenceLinkHref(
                  buttonUrl,
                  site.siteMap,
                  site.assetsBaseUrl,
                )}
                size="lg"
                variant="solid"
                colorScheme={heroButton}
                LinkComponent={LinkComponent}
                isWithFocusVisibleHighlight
              >
                {buttonLabel}
              </LinkButton>
              {secondaryButtonLabel && secondaryButtonUrl && (
                <LinkButton
                  colorScheme={heroButton}
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
      <div
        className="relative h-80 overflow-hidden lg:h-auto lg:max-h-full lg:min-h-[31.25rem] lg:w-1/2"
        style={{ contain: "layout" }}
      >
        <ImageClient
          src={backgroundSrc}
          alt={title}
          width="100%"
          className="absolute inset-0 h-full w-full object-cover object-center"
          assetsBaseUrl={site.assetsBaseUrl}
          lazyLoading={false} // hero is always above the fold
          fetchPriority="high"
        />
      </div>
    </section>
  )
}
