import { BiRightArrowAlt } from "react-icons/bi"

import type { ChildrenPagesProps, ImageClientProps } from "~/interfaces"
import type { IsomerSitemap } from "~/types"
import { INFOCARD_VARIANT } from "~/interfaces/complex/InfoCards"
import { IMAGE_FIT } from "~/interfaces/constants"
import { tv } from "~/lib/tv"
import { getNodeFromSiteMap } from "~/utils/getNodeFromSiteMap"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"
import { ComponentContent } from "../../internal/customCssClass"
import { ImageClient } from "../../internal/ImageClient"
import { Link } from "../../internal/Link"
import { compoundStyles, infoCardTitleStyle } from "../InfoCards/common"
import { InfoCardNoImage, InfoCardWithImage } from "../InfoCards/components"
import { createChildrenPagesComparator } from "./utils"

interface Childpage {
  title: string
  url: string
  description: string
  image?: IsomerSitemap["image"]
}

interface ChildpageLayoutProps
  extends Pick<
      ChildrenPagesProps,
      | "showSummary"
      | "imageFit"
      | "showThumbnail"
      | "shouldLazyLoad"
      | "LinkComponent"
      | "site"
      | "maxColumns"
    >,
    Pick<ImageClientProps, "assetsBaseUrl"> {
  childpages: Childpage[]
  fallback: Required<NonNullable<IsomerSitemap["image"]>>
}

const BoxLayout = ({
  childpages,
  showSummary,
  showThumbnail,
  fallback,
  shouldLazyLoad,
  LinkComponent,
  site,
  maxColumns = "2",
  imageFit = "cover",
}: ChildpageLayoutProps) => {
  return (
    <div
      className={compoundStyles.grid({
        maxColumns,
        variant: "default",
        class: "[&:not(:first-child)]:mt-7",
      })}
    >
      {childpages.map(({ title, description, url, image }, idx) => {
        if (showThumbnail) {
          const hasImage = !!image?.src
          const imageUrl = hasImage ? image.src : fallback.src
          const imageAlt = hasImage ? (image.alt ?? "") : fallback.alt

          return (
            <InfoCardWithImage
              key={`${title}-${idx}`}
              title={title}
              description={showSummary ? description : undefined}
              url={url}
              imageUrl={imageUrl}
              imageAlt={imageAlt}
              imageFit={imageFit}
              maxColumns={maxColumns}
              layout="index"
              site={site}
              isFallback={!hasImage}
              LinkComponent={LinkComponent}
              shouldLazyLoad={shouldLazyLoad}
            />
          )
        }

        return (
          <InfoCardNoImage
            key={`${title}-${idx}`}
            title={title}
            description={showSummary ? description : undefined}
            url={url}
            site={site}
            LinkComponent={LinkComponent}
          />
        )
      })}
    </div>
  )
}

const createRowStyles = tv({
  slots: {
    container: `${ComponentContent} grid grid-cols-3 gap-9 md:grid-cols-6 lg:grid-cols-12 [&:not(:first-child)]:mt-7`,
    image: "bg-white",
    imageContainer:
      "flex aspect-[3/2] h-full w-full justify-center overflow-hidden rounded-lg border bg-base-canvas drop-shadow-none transition ease-in group-hover:drop-shadow-md max-md:col-span-full max-md:row-span-1 md:col-span-2 lg:col-span-3",
    textContainer:
      "flex flex-col justify-center gap-2 break-words max-md:col-span-full max-md:row-span-1",
    contentContainer:
      "max-md:grid-rows-[1fr fit-content] group grid grid-cols-subgrid max-md:col-span-full max-md:gap-y-5 md:col-span-6 lg:col-span-12",
    title: [
      groupFocusVisibleHighlight(),
      infoCardTitleStyle({
        isClickableCard: true,
        variant: INFOCARD_VARIANT.default,
      }),
    ],
    description: "prose-body-base text-base-content",
  },
  variants: {
    layout: {
      default: {},
    },
    imageFit: {
      cover: {
        image: "object-cover",
      },
      contain: {
        image: "object-contain",
      },
    },
    hasThumbnail: {
      true: {
        textContainer: "md:col-span-4 md:ml-[-1.25rem] lg:col-span-9",
        contentContainer: "p-0",
      },
      false: { textContainer: "md:col-span-6 lg:col-span-12" },
    },
    hasFallbackImage: {
      true: { image: "h-auto w-2/3 object-contain" },
    },
  },

  defaultVariants: {
    layout: "default",
  },
})

const RowLayout = ({
  childpages,
  showSummary,
  showThumbnail,
  assetsBaseUrl,
  fallback,
  shouldLazyLoad,
  LinkComponent,
  site,
  imageFit,
}: ChildpageLayoutProps): JSX.Element => {
  const styles = createRowStyles()

  return (
    <div className={styles.container()}>
      {childpages.map(({ title, description, url, image }, idx) => {
        const renderedImage = image?.src ? image : fallback

        return (
          <Link
            href={getReferenceLinkHref(
              url,
              site.siteMapArray,
              site.assetsBaseUrl,
            )}
            key={`${title}-${idx}`}
            LinkComponent={LinkComponent}
            className={styles.contentContainer({
              hasThumbnail: !!showThumbnail,
            })}
          >
            {showThumbnail && (
              <div className={styles.imageContainer()}>
                <ImageClient
                  assetsBaseUrl={assetsBaseUrl}
                  lazyLoading={shouldLazyLoad}
                  src={renderedImage.src}
                  alt={renderedImage.alt}
                  width="100%"
                  className={styles.image({
                    hasFallbackImage: !image?.src,
                    imageFit,
                  })}
                />
              </div>
            )}
            <div
              className={styles.textContainer({
                hasThumbnail: !!showThumbnail,
              })}
            >
              <p className={styles.title()}>
                <span>{title}</span>
                {url && (
                  <BiRightArrowAlt
                    aria-hidden
                    className={compoundStyles.cardTitleArrow({
                      isExternalLink: false,
                      variant: INFOCARD_VARIANT.default,
                    })}
                  />
                )}
              </p>
              {showSummary && (
                <p className={styles.description()}>{description}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export const ChildrenPages = ({
  childrenPagesOrdering = [],
  permalink,
  site,
  LinkComponent,
  variant,
  showSummary = true,
  showThumbnail,
  shouldLazyLoad,
  maxColumns = "2",
  imageFit = IMAGE_FIT.Cover,
}: ChildrenPagesProps) => {
  const currentPageNode = getNodeFromSiteMap(site.siteMap, permalink)

  if (!currentPageNode?.children) {
    return <></>
  }

  const comparator = createChildrenPagesComparator(childrenPagesOrdering)
  const children = currentPageNode.children
    .map((child) => ({
      id: child.id,
      title: child.title,
      url: child.permalink,
      description: child.summary,
      image: child.image,
    }))
    .sort(comparator)

  if (variant === "boxes") {
    return (
      <BoxLayout
        LinkComponent={LinkComponent}
        assetsBaseUrl={site.assetsBaseUrl}
        childpages={children}
        showSummary={showSummary}
        showThumbnail={showThumbnail}
        fallback={{ src: site.logoUrl, alt: "Default logo of the site" }}
        shouldLazyLoad={shouldLazyLoad}
        site={site}
        maxColumns={maxColumns}
        imageFit={imageFit}
      />
    )
  }

  // NOTE: There are only 2 layouts (and 1 autogenerated).
  // If the user does not have a layout specified,
  // they were using the autogenerated layout before.
  // Hence, we will default to `row` for them
  return (
    <RowLayout
      LinkComponent={LinkComponent}
      assetsBaseUrl={site.assetsBaseUrl}
      childpages={children}
      showSummary={showSummary}
      showThumbnail={showThumbnail}
      fallback={{ src: site.logoUrl, alt: "Default logo of the site" }}
      shouldLazyLoad={shouldLazyLoad}
      site={site}
      imageFit={imageFit}
    />
  )
}
