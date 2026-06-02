import type { HeroBlockProps } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { ImageClient } from "../../internal/ImageClient"
import { LinkButton } from "../../internal/LinkButton/LinkButton"

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
  theme = "default",
}: HeroBlockProps) => {
  const heroColour = HERO_THEME_MAPPINGS.hero[theme]
  const heroTextColour = HERO_THEME_MAPPINGS.text[theme]
  const heroButton = HERO_THEME_MAPPINGS.button[theme]

  return (
    <section className="flex-col flex min-h-[15rem] lg:flex-row sm:min-h-[22.5rem] lg:min-h-[31.25rem]">
      <div
        className={`flex-row flex ${heroColour} px-6 pb-12 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pl-10 lg:pr-8`}
      >
        <div
          className={`flex-col gap-9 flex w-full max-w-[548px] justify-center ${heroTextColour}`}
        >
          <div className="flex-col gap-6 flex">
            <h1 className="wrap-break-word prose-display-xl text-balance">
              {title}
            </h1>
            {subtitle && <p className="prose-title-lg-regular">{subtitle}</p>}
          </div>
          {buttonLabel && buttonUrl && (
            <div className="flex-col gap-y-4 gap-x-5 flex justify-start sm:flex-row">
              <LinkButton
                href={getReferenceLinkHref(
                  buttonUrl,
                  site.siteMapArray,
                  site.assetsBaseUrl,
                )}
                size="lg"
                variant="solid"
                colorScheme={heroButton}
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
                    site.siteMapArray,
                    site.assetsBaseUrl,
                  )}
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
          src={backgroundUrl}
          alt=""
          width="100%"
          className="absolute inset-0 h-full w-full object-cover object-center"
          assetsBaseUrl={site.assetsBaseUrl}
          lazyLoading={false} // hero is always above the fold
        />
      </div>
    </section>
  )
}
