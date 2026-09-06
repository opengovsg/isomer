import type { BlockquoteProps } from "~/interfaces"
import { BiSolidQuoteAltLeft } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import { ComponentContent } from "../../internal/customCssClass"
import { ImageClient } from "../../internal/ImageClient"

const createBlockquoteStyles = tv({
  defaultVariants: {
    layout: "default",
  },
  slots: {
    blockquote: "text-base-content-strong",
    citation: "text-base-content-default not-italic",
    image: "object-cover",
    innerContainer: `${ComponentContent} flex`,
    openApostrophe: "text-brand-canvas-inverse",
    outerContainer: "bg-base-canvas-alt",
    quoteContainer: "flex w-full flex-col gap-3",
    textContainer: "flex flex-col",
  },
  variants: {
    layout: {
      default: {
        blockquote: "prose-headline-base-medium italic",
        citation: "prose-body-sm",
        image: "h-24 min-h-24 w-24 min-w-24 rounded-full",
        innerContainer: "flex-col gap-6 px-5 py-4 sm:flex-row sm:gap-10",
        openApostrophe: "text-[32px]",
        outerContainer:
          "mt-6 border-l-4 border-brand-canvas-inverse first:mt-0",
        quoteContainer: "sm:flex-row",
        textContainer: "gap-3",
      },
      homepage: {
        blockquote: "prose-display-sm not-italic",
        citation: "prose-headline-lg-medium",
        image: "h-60 min-h-60 w-60 min-w-60",
        innerContainer:
          "flex-col-reverse gap-10 px-6 py-16 sm:flex-row-reverse sm:px-10 lg:py-24",
        openApostrophe: "text-[64px]",
        quoteContainer: "gap-4",
        textContainer: "gap-4",
      },
    },
  },
})

export const Blockquote = ({
  quote,
  source,
  imageSrc,
  imageAlt,
  layout,
  shouldLazyLoad,
  site,
}: BlockquoteProps) => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const variants = {
    layout: simplifiedLayout,
  } as const
  const compoundStyles = createBlockquoteStyles(variants)

  return (
    <section className={compoundStyles.outerContainer()}>
      <div className={compoundStyles.innerContainer()}>
        <div className={compoundStyles.quoteContainer()}>
          <div className={compoundStyles.openApostrophe()} aria-hidden>
            <BiSolidQuoteAltLeft />
          </div>

          <div className={compoundStyles.textContainer()}>
            <blockquote className={compoundStyles.blockquote()}>
              {quote}
            </blockquote>

            <cite className={compoundStyles.citation()}>— {source}</cite>
          </div>
        </div>

        {imageSrc && imageAlt && (
          <ImageClient
            src={imageSrc}
            alt={imageAlt}
            width="100%"
            className={compoundStyles.image()}
            assetsBaseUrl={site.assetsBaseUrl}
            lazyLoading={shouldLazyLoad}
          />
        )}
      </div>
    </section>
  )
}
