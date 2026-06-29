import type { HeroLargeImageProps } from "~/interfaces/complex/Hero"
import { twMerge } from "~/lib/twMerge"
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
    <section className="flex w-full flex-col">
      {/* Text and button container */}
      <div
        className={twMerge(
          "mx-auto flex w-full flex-col gap-6 px-6 pt-10 pb-12 md:gap-9 lg:pt-12 lg:pb-16",
          ComponentContent,
        )}
      >
        {/* Text container */}
        <div className="text-base-content-strong flex flex-col items-center gap-5 sm:items-start md:gap-6 md:text-center lg:mx-auto lg:max-w-[66.67%]">
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
