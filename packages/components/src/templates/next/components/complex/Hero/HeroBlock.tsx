import type { HeroBlockProps } from "~/interfaces/complex/Hero"
import { HERO_BLOCK_IMAGE_POSITION } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { ImageClient } from "../../internal/ImageClient"
import { LinkButton } from "../../internal/LinkButton/LinkButton"

const HERO_BUTTON_COLOR_SCHEME = {
  default: "inverse",
  inverse: "default",
} as const

const heroBlockStyles = tv({
  slots: {
    section:
      "flex min-h-[15rem] flex-col sm:min-h-[22.5rem] lg:min-h-[31.25rem]",
    textContainer: "flex flex-row px-6 pb-12 pt-11 md:px-10 lg:w-1/2",
    text: "flex w-full max-w-[548px] flex-col justify-center gap-9",
  },
  variants: {
    theme: {
      default: {
        textContainer: "bg-brand-canvas-inverse",
        text: "text-base-content-inverse",
      },
      inverse: {
        textContainer: "bg-brand-canvas-alt",
        text: "text-base-content",
      },
    },
    // On mobile the text always stacks above the image; the position only
    // affects the side-by-side layout on large screens.
    imagePosition: {
      [HERO_BLOCK_IMAGE_POSITION.right]: {
        section: "lg:flex-row",
        textContainer: "lg:justify-end lg:pl-10 lg:pr-8",
      },
      [HERO_BLOCK_IMAGE_POSITION.left]: {
        section: "lg:flex-row-reverse",
        textContainer: "lg:justify-start lg:pl-8 lg:pr-10",
      },
    },
  },
})

export const HeroBlock = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  backgroundUrl,
  imagePosition = HERO_BLOCK_IMAGE_POSITION.right,
  site,
  theme = "default",
  headingLevel,
}: HeroBlockProps) => {
  const heroButton = HERO_BUTTON_COLOR_SCHEME[theme]
  const styles = heroBlockStyles({ theme, imagePosition })
  const Tag = getHeadingTag(headingLevel)

  return (
    <section className={styles.section()}>
      <div className={styles.textContainer()}>
        <div className={styles.text()}>
          <div className="flex flex-col gap-6">
            <Tag className="wrap-break-word prose-display-xl text-balance">
              {title}
            </Tag>
            {subtitle && <p className="prose-title-lg-regular">{subtitle}</p>}
          </div>
          {buttonLabel && buttonUrl && (
            <div className="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row">
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
