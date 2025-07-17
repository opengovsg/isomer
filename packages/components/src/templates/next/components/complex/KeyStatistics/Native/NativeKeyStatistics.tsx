import type { NativeKeyStatisticsProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getReferenceLinkHref, getTailwindVariantLayout } from "~/utils"
import { ComponentContent } from "../../../internal/customCssClass"
import { LinkButton } from "../../../internal/LinkButton"

const MAX_ITEMS = 4
type NoOfItemVariants = 1 | 2 | 3 | 4

// This is the maximum number of characters in a key statistic value
// This is required because we make all columns have the same width. If there is
// a value that is very large relative to the other values, then there will be
// a lot of weird white space. 7 characters should fit most use-cases.
// Example: +$1.23M, +235.2%, $123.4B
const MAX_CHAR_LIMIT = 7

const createKeyStatisticsStyles = tv({
  slots: {
    container: `${ComponentContent} flex flex-col`,
    title:
      "prose-display-md w-full max-w-[47.5rem] break-words text-base-content-strong",
    urlText: "hidden whitespace-nowrap md:block",
    urlButtonContainer: "mx-auto mt-2 block",
    statistics: "flex flex-col flex-wrap gap-x-8 gap-y-12 md:flex-row",
    itemContainer: "flex grow flex-col gap-3",
    itemValue: "prose-display-lg text-pretty text-brand-canvas-inverse",
    itemLabel: "prose-label-md-medium text-base-content-subtle",
  },
  variants: {
    noOfItems: {
      1: {
        itemContainer: "md:basis-full",
      },
      2: {
        itemContainer: "md:basis-[calc((100%-2.5rem)/2)]",
      },
      3: {
        itemContainer: "md:basis-[calc((100%-5rem)/3)]",
      },
      4: {
        itemContainer: "md:basis-[calc((100%-7.5rem)/4)]",
      },
    },
    layout: {
      homepage: {
        container: "gap-10 py-12 xs:py-24 lg:gap-12",
      },
      default: {
        container: "mt-14 gap-12 first:mt-0",
      },
    },
  },
  defaultVariants: {
    layout: "default",
  },
})

const compoundStyles = createKeyStatisticsStyles()

export const NativeKeyStatistics = ({
  id,
  title,
  url,
  label,
  layout,
  site,
  LinkComponent,
  statistics,
}: NativeKeyStatisticsProps) => {
  const noOfItems = Math.min(MAX_ITEMS, statistics.length) as NoOfItemVariants
  const simplifiedLayout = getTailwindVariantLayout(layout)

  return (
    <section
      id={id}
      className={compoundStyles.container({ layout: simplifiedLayout })}
    >
      <h2 className={compoundStyles.title()}>{title}</h2>

      <div className={compoundStyles.statistics()}>
        {statistics.slice(0, MAX_ITEMS).map(({ label, value }, index) => (
          <div
            key={index}
            className={compoundStyles.itemContainer({ noOfItems })}
          >
            <h3 className={compoundStyles.itemValue()}>
              {value.slice(0, MAX_CHAR_LIMIT)}
            </h3>

            <p className={compoundStyles.itemLabel()}>{label}</p>
          </div>
        ))}
      </div>

      {!!url && (
        <div className={compoundStyles.urlButtonContainer()}>
          <LinkButton
            href={getReferenceLinkHref(url, site.siteMap, site.assetsBaseUrl)}
            size="base"
            variant="outline"
            LinkComponent={LinkComponent}
            isWithFocusVisibleHighlight
          >
            {!!label ? label : "Our achievements"}
          </LinkButton>
        </div>
      )}
    </section>
  )
}
