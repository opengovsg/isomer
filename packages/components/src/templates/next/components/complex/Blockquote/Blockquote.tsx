import { BiSolidQuoteAltLeft } from "react-icons/bi"

import type { BlockquoteProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getTailwindVariantLayout } from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { ImageClient } from "../Image"

const createBlockquoteStyles = tv({
  slots: {
    outerContainer: "mt-6 bg-base-canvas-alt first:mt-0",
    innerContainer: `${ComponentContent} flex`,
    quoteContainer: "flex w-full flex-col gap-3",
    openApostrophe: "text-brand-canvas-inverse",
    textContainer: "flex flex-col",
    blockquote: "text-base-content-strong",
    citation: "text-base-content-default not-italic",
    image: "object-cover",
  },
  variants: {
    layout: {
      homepage: {
        innerContainer:
          "flex-col-reverse gap-10 px-6 py-16 sm:flex-row-reverse sm:px-10 lg:py-24",
        quoteContainer: "gap-4",
        openApostrophe: "text-[64px]",
        textContainer: "gap-4",
        blockquote: "prose-display-md not-italic",
        citation: "prose-headline-lg-medium",
        image: "h-60 min-h-60 w-60 min-w-60",
      },
      default: {
        outerContainer: "border-l-4 border-brand-canvas-inverse",
        innerContainer: "flex-col gap-6 px-5 py-4 sm:flex-row sm:gap-10",
        quoteContainer: "sm:flex-row",
        openApostrophe: "text-[32px]",
        textContainer: "gap-3",
        blockquote: "prose-headline-base-medium italic",
        citation: "prose-body-sm",
        image: "h-24 min-h-24 w-24 min-w-24 rounded-full",
      },
    },
  },
  defaultVariants: {
    layout: "default",
  },
})

const compoundStyles = createBlockquoteStyles()

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

  return (
    <section className={compoundStyles.outerContainer(variants)}>
      <div className={compoundStyles.innerContainer(variants)}>
        <div className={compoundStyles.quoteContainer(variants)}>
          <div className={compoundStyles.openApostrophe(variants)} aria-hidden>
            <BiSolidQuoteAltLeft />
          </div>

          <div className={compoundStyles.textContainer(variants)}>
            <blockquote className={compoundStyles.blockquote(variants)}>
              {quote}
            </blockquote>

            <cite className={compoundStyles.citation(variants)}>
              — {source}
            </cite>
          </div>
        </div>

        {imageSrc && imageAlt && (
          <ImageClient
            src={imageSrc}
            alt={imageAlt}
            width="100%"
            className={compoundStyles.image(variants)}
            assetsBaseUrl={site.assetsBaseUrl}
            lazyLoading={shouldLazyLoad}
          />
        )}
      </div>
    </section>
  )
}
