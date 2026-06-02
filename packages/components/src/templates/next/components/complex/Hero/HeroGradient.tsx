import type { HeroGradientProps } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { ComponentContent } from "../../internal/customCssClass"
import { ImageClient } from "../../internal/ImageClient"
import { LinkButton } from "../../internal/LinkButton/LinkButton"

export const HeroGradient = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  site,
}: HeroGradientProps) => {
  return (
    <section className="relative flex min-h-[15rem] sm:min-h-[22.5rem] lg:min-h-[31.25rem]">
      <div
        className="absolute inset-0 min-h-[15rem] min-w-full overflow-hidden sm:min-h-[22.5rem] lg:min-h-[31.25rem]"
        style={{ contain: "layout" }}
        aria-hidden
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
      <div className="relative z-10 w-full content-center bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)] xl:from-[rgba(0,0,0,100%)]">
        <div
          className={`${ComponentContent} flex-row flex justify-start py-16 text-start text-base-content-inverse`}
        >
          <div className="xl:max-w-50% flex-col gap-9 flex w-full sm:w-3/5">
            <div className="flex-col gap-6 flex">
              <h1 className="prose-display-xl break-words">{title}</h1>
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
                  isWithFocusVisibleHighlight
                >
                  {buttonLabel}
                </LinkButton>
                {secondaryButtonLabel && secondaryButtonUrl && (
                  <LinkButton
                    colorScheme="inverse"
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
      </div>
    </section>
  )
}
