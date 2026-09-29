import {
  type HeroBlockProps,
  HERO_BLOCK_IMAGE_EDGE,
  HERO_BLOCK_IMAGE_POSITION,
} from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { ImageClient } from "../../internal/ImageClient"
import { LinkButton } from "../../internal/LinkButton/LinkButton"

const HERO_THEME_MAPPINGS = {
  text: {
    default: "text-base-content-inverse",
    inverse: "text-base-content",
  },
  button: {
    default: "inverse",
    inverse: "default",
  },
} as const

const heroBlockStyles = tv({
  slots: {
    section:
      "flex min-h-[15rem] flex-col sm:min-h-[22.5rem] lg:min-h-[31.25rem]",
    textColumn: "flex flex-row px-6 pb-12 pt-11 md:px-10 lg:w-1/2",
    imageColumn:
      "relative h-80 overflow-hidden lg:h-auto lg:max-h-full lg:min-h-[31.25rem] lg:w-1/2",
    image: "absolute inset-0 h-full w-full object-cover object-center",
  },
  variants: {
    theme: {
      default: {},
      inverse: {},
    },
    // Right: copy above image on small screens. Left: image above copy on small
    // screens. Position only affects side-by-side layout from `lg` upward.
    imagePosition: {
      [HERO_BLOCK_IMAGE_POSITION.right]: {
        section: "lg:flex-row",
        textColumn: "lg:justify-end lg:pl-10 lg:pr-8",
      },
      [HERO_BLOCK_IMAGE_POSITION.left]: {
        section: "max-lg:flex-col-reverse lg:flex-row-reverse",
        textColumn: "lg:justify-start lg:pl-8 lg:pr-10",
      },
    },
    imageEdge: {
      straight: {},
      curved: {
        section: "lg:[container-type:inline-size]",
      },
    },
  },
  compoundVariants: [
    {
      imagePosition: HERO_BLOCK_IMAGE_POSITION.right,
      imageEdge: HERO_BLOCK_IMAGE_EDGE.curved,
      class: {
        // Desktop: center sits one radius in from the inner edge, so the
        // curve is tangent to the 50% split.
        imageColumn:
          "max-lg:[clip-path:path('M_0_1.5rem_Q_50%_0_100%_1.5rem_L_100%_100%_L_0_100%_Z')] lg:[clip-path:circle(36cqw_at_36cqw_50%)]",
      },
    },
    {
      imagePosition: HERO_BLOCK_IMAGE_POSITION.left,
      imageEdge: HERO_BLOCK_IMAGE_EDGE.curved,
      class: {
        // Desktop: mirrored so the curve is tangent to the 50% split.
        imageColumn:
          "max-lg:[clip-path:path('M_0_0_L_100%_0_L_100%_calc(100%-1.5rem)_Q_50%_100%_0_calc(100%-1.5rem)_Z')] lg:[clip-path:circle(36cqw_at_calc(100%_-_36cqw)_50%)]",
      },
    },
    {
      theme: "default",
      imageEdge: HERO_BLOCK_IMAGE_EDGE.straight,
      class: {
        textColumn: "bg-brand-canvas-inverse",
      },
    },
    {
      theme: "inverse",
      imageEdge: HERO_BLOCK_IMAGE_EDGE.straight,
      class: {
        textColumn: "bg-brand-canvas-alt",
      },
    },
    {
      theme: "default",
      imageEdge: HERO_BLOCK_IMAGE_EDGE.curved,
      class: {
        section: "lg:bg-brand-canvas-inverse",
        textColumn: "max-lg:bg-brand-canvas-inverse",
      },
    },
    {
      theme: "inverse",
      imageEdge: HERO_BLOCK_IMAGE_EDGE.curved,
      class: {
        section: "lg:bg-brand-canvas-alt",
        textColumn: "max-lg:bg-brand-canvas-alt",
      },
    },
  ],
  defaultVariants: {
    theme: "default",
    imageEdge: HERO_BLOCK_IMAGE_EDGE.straight,
    imagePosition: HERO_BLOCK_IMAGE_POSITION.right,
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
  blockImage,
  site,
  theme = "default",
  headingLevel,
}: HeroBlockProps) => {
  const heroTextColour = HERO_THEME_MAPPINGS.text[theme]
  const heroButton = HERO_THEME_MAPPINGS.button[theme]
  const Tag = getHeadingTag(headingLevel)
  const styles = heroBlockStyles({
    theme,
    imageEdge: blockImage?.imageEdge,
    imagePosition: blockImage?.imagePosition,
  })

  return (
    <section className={styles.section()}>
      <div className={styles.textColumn()}>
        <div
          className={`flex w-full max-w-[548px] flex-col justify-center gap-9 ${heroTextColour}`}
        >
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
      <div className={styles.imageColumn()} style={{ contain: "layout" }}>
        <ImageClient
          src={backgroundUrl}
          alt=""
          width="100%"
          className={styles.image()}
          assetsBaseUrl={site.assetsBaseUrl}
          lazyLoading={false} // hero is always above the fold
        />
      </div>
    </section>
  )
}
