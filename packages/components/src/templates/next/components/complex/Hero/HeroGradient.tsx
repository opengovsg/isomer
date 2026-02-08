import type { HeroGradientProps } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref, isExternalUrl } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { LinkButton } from "../../internal/LinkButton/LinkButton"
import { ImageClient } from "../Image"

export const HeroGradient = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  site,
  LinkComponent,
}: HeroGradientProps) => {
  const backgroundSrc =
    isExternalUrl(backgroundUrl) || site.assetsBaseUrl === undefined
      ? backgroundUrl
      : `${site.assetsBaseUrl}${backgroundUrl}`

  return (
    <section className="relative flex min-h-[15rem] sm:min-h-[22.5rem] lg:min-h-[31.25rem]">
      <ImageClient
        src={backgroundSrc}
        alt={title}
        width="100%"
        className="absolute inset-0 h-full w-full object-cover object-center"
        assetsBaseUrl={site.assetsBaseUrl}
        lazyLoading={false} // hero is always above the fold
        fetchPriority="high"
      />
      <div className="relative z-10 w-full content-center bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)] xl:from-[rgba(0,0,0,100%)]">
        <div
          className={`${ComponentContent} flex flex-row justify-start py-16 text-start text-base-content-inverse`}
        >
          <div className="xl:max-w-50% flex w-full flex-col gap-9 sm:w-3/5">
            <div className="flex flex-col gap-6">
              <h1 className="prose-display-xl break-words">{title}</h1>
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
                  LinkComponent={LinkComponent}
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
      </div>
    </section>
  )
}
