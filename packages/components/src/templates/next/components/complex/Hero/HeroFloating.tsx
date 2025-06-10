import type { HeroProps } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { LinkButton } from "../../internal/LinkButton/LinkButton"
import { ImageClient } from "../Image"

const HERO_THEME_MAPPINGS = {
  hero: {
    default: "bg-brand-canvas-inverse",
    inverse: "bg-brand-canvas",
  },
  title: {
    default: "text-base-content-inverse",
    inverse: "text-base-content-strong",
  },
  subtitle: {
    default: "text-base-content-inverse",
    inverse: "text-base-content",
  },
  button: {
    default: "inverse",
    inverse: "default",
  },
} as const

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

  const heroColour = HERO_THEME_MAPPINGS.hero[theme]
  const heroTitleColour = HERO_THEME_MAPPINGS.title[theme]
  const heroSubtitleColour = HERO_THEME_MAPPINGS.subtitle[theme]
  const heroButton = HERO_THEME_MAPPINGS.button[theme]

  return (
    <section
      // we have !px-0, sm:!px-0 and md:!px-0 to override the default px from ComponentContent
      className={`${ComponentContent} flex w-full flex-col items-center !px-0 pb-12 pt-6 sm:!px-0 md:!px-0 md:pb-24 md:pt-16 lg:items-start lg:!px-10`}
    >
      {/* Image with aspect ratio and max height */}
      <div className="lg:flex lg:w-full lg:justify-end">
        <ImageClient
          src={backgroundSrc}
          alt={title}
          width="100%"
          className="aspect-[3/2] w-full object-center lg:w-[66.67%]"
          lazyLoading={false}
        />
      </div>
      {/* Floating container */}
      <div className="-mt-[1.5rem] w-full max-w-[calc(100%-3rem)] md:-mt-[10rem] md:max-w-[calc(100%-5rem)] lg:-mt-[17.85rem] lg:max-w-none">
        <div
          className={`flex w-full flex-col gap-9 px-4 py-6 md:gap-[38px] md:p-12 lg:max-w-[66.67%] ${heroColour}`}
        >
          {/* Text container */}
          <div className={`flex flex-col gap-6 text-start ${heroTitleColour}`}>
            <h1 className={`prose-display-xl ${heroTitleColour}`}>{title}</h1>
            {subtitle && (
              <p className={`prose-title-lg-regular ${heroSubtitleColour}`}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Button container */}
          {buttonLabel && buttonUrl && (
            <div className="flex flex-col justify-start gap-x-5 gap-y-4 md:flex-row">
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
                  href={getReferenceLinkHref(
                    secondaryButtonUrl,
                    site.siteMap,
                    site.assetsBaseUrl,
                  )}
                  variant="outline"
                  size="lg"
                  colorScheme={heroButton}
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
