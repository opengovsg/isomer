import type { HeroGradientProps } from "~/interfaces/complex/Hero"
import { getHeadingTag } from "~/utils/getHeadingTag"

import { ComponentContent } from "../../../internal/customCssClass"
import { ImageClient } from "../../../internal/ImageClient"
import { Buttons } from "../shared/Buttons"

export const HeroGradientButtons = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  site,
  headingLevel,
}: HeroGradientProps) => {
  const Tag = getHeadingTag(headingLevel)
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
          className={`${ComponentContent} flex flex-row justify-start py-16 text-start text-base-content-inverse`}
        >
          <div className="xl:max-w-50% flex w-full flex-col gap-9 sm:w-3/5">
            <div className="flex flex-col gap-6">
              <Tag className="prose-display-xl break-words">{title}</Tag>
              {subtitle && <p className="prose-title-lg-regular">{subtitle}</p>}
            </div>
            <Buttons
              buttonLabel={buttonLabel}
              buttonUrl={buttonUrl}
              secondaryButtonLabel={secondaryButtonLabel}
              secondaryButtonUrl={secondaryButtonUrl}
              site={site}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
