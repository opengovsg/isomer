import type { HeroLargeImageProps } from "~/interfaces/complex/Hero"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { ComponentContent } from "../../../internal/customCssClass"
import { LinkButton } from "../../../internal/LinkButton/LinkButton"
import { ImageContainer } from "./ImageContainer"

export const HeroLargeImage = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  site,
}: HeroLargeImageProps) => {
  return (
    <section className="flex-col flex w-full">
      {/* Text and button container */}
      <div
        className={`flex-col gap-6 mx-auto flex w-full px-6 pb-12 pt-10 md:gap-9 lg:pb-16 lg:pt-12 ${ComponentContent}`}
      >
        {/* Text container */}
        <div className="flex-col gap-5 flex items-center text-base-content-strong md:gap-6 sm:items-start md:text-center lg:mx-auto lg:max-w-[66.67%]">
          <h1 className="prose-display-xl w-full">{title}</h1>
          {subtitle && (
            <p className="prose-title-lg-regular w-full">{subtitle}</p>
          )}
        </div>
        {/* Button container */}
        {buttonLabel && buttonUrl && (
          <div className="flex-col gap-y-4 gap-x-5 flex items-start justify-center md:flex-row md:items-center">
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
      <ImageContainer
        imageSrc={backgroundUrl}
        imageAlt=""
        assetsBaseUrl={site.assetsBaseUrl}
      />
    </section>
  )
}
