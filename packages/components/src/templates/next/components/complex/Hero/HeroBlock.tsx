import {
  type HeroBlockProps,
  HERO_BLOCK_SHAPE,
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

// Desktop cutout. The image column widens from 50% to 52% of the hero and
// pulls left by 2%, so it spans 48%-100%. A circle clip centred at 84% of the
// hero (69.23% of the column) with a radius of 36% of the hero then starts
// exactly at the column's left edge. The section is the size container, so
// `36cqw` is 36% of the hero width. The image still covers a near-identical
// box to the straight layout, so its scale barely changes. Below `lg` the
// image stays a rectangle.
const CURVED_CUTOUT_CLIP =
  "lg:-ml-[2%] lg:w-[52%] lg:[clip-path:circle(36cqw_at_69.23%_50%)]"

const heroBlockStyles = tv({
  slots: {
    section:
      "flex min-h-[15rem] flex-col sm:min-h-[22.5rem] lg:min-h-[31.25rem] lg:flex-row",
    textColumn:
      "flex flex-row px-6 pb-12 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pl-10 lg:pr-8",
    imageColumn:
      "relative h-80 overflow-hidden lg:h-auto lg:max-h-full lg:min-h-[31.25rem] lg:w-1/2",
    image: "absolute inset-0 h-full w-full object-cover object-center",
  },
  variants: {
    theme: {
      default: {},
      inverse: {},
    },
    shape: {
      straight: {},
      curved: {
        section: "lg:[container-type:inline-size]",
        imageColumn: CURVED_CUTOUT_CLIP,
      },
    },
  },
  compoundVariants: [
    {
      theme: "default",
      shape: HERO_BLOCK_SHAPE.straight,
      class: {
        textColumn: "bg-brand-canvas-inverse",
      },
    },
    {
      theme: "inverse",
      shape: HERO_BLOCK_SHAPE.straight,
      class: {
        textColumn: "bg-brand-canvas-alt",
      },
    },
    {
      theme: "default",
      shape: HERO_BLOCK_SHAPE.curved,
      class: {
        section: "lg:bg-brand-canvas-inverse",
        textColumn: "max-lg:bg-brand-canvas-inverse",
      },
    },
    {
      theme: "inverse",
      shape: HERO_BLOCK_SHAPE.curved,
      class: {
        section: "lg:bg-brand-canvas-alt",
        textColumn: "max-lg:bg-brand-canvas-alt",
      },
    },
  ],
  defaultVariants: {
    theme: "default",
    shape: HERO_BLOCK_SHAPE.straight,
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
  shape = HERO_BLOCK_SHAPE.straight,
  site,
  theme = "default",
  headingLevel,
}: HeroBlockProps) => {
  const heroTextColour = HERO_THEME_MAPPINGS.text[theme]
  const heroButton = HERO_THEME_MAPPINGS.button[theme]
  const Tag = getHeadingTag(headingLevel)
  const styles = heroBlockStyles({ theme, shape })

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
