import type { ChildrenPagesProps, ImageClientProps } from "~/interfaces"
import type { IsomerSitemap } from "~/types"
import { tv } from "~/lib/tv"
import { getNodeFromSiteMap } from "~/utils/getNodeFromSiteMap"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"
import { ComponentContent } from "../../internal/customCssClass"
import { ImageClient } from "../../internal/ImageClient"
import { Link } from "../../internal/Link"
import { compoundStyles } from "../InfoCards/common"
import { InfoCardNoImage, InfoCardWithImage } from "../InfoCards/components"
import { mergeChildrenPages } from "./utils"

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
              imageFit={hasImage ? "cover" : "contain"}
              maxColumns={maxColumns}
              layout="index"
              site={site}
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
    container: `${ComponentContent} grid grid-cols-3 gap-10 md:grid-cols-6 lg:grid-cols-12 [&:not(:first-child)]:mt-7`,
    image: "rounded-l-sm bg-white",
    imageContainer:
      "align-center flex aspect-[3/2] h-full w-full justify-center max-md:col-span-full max-md:row-span-1 max-md:border-b max-md:border-b-base-divider-subtle md:col-span-2 md:border-r md:border-r-base-divider-subtle lg:col-span-3",
    textContainer:
      "flex flex-col gap-2 break-words max-md:col-span-full max-md:row-span-1",
    contentContainer:
      // NOTE: Our `rounded-sm` compiles down to `0.125 rem` rather than `0.25 rem`, necessitating this
      "max-md:grid-rows-[1fr fit-content] group grid grid-cols-subgrid rounded-[0.25rem] border border-base-divider-medium p-5 max-md:col-span-full max-md:gap-y-5 md:col-span-6 lg:col-span-12",
    title: [
      groupFocusVisibleHighlight(),
      "prose-title-md-medium text-base-content-strong group-hover:text-brand-canvas-inverse group-hover:underline",
    ],
    description: "prose-body-base text-base-content",
  },
  variants: {
    layout: {
      default: {},
    },
    hasThumbnail: {
      true: {
        textContainer:
          "pb-5 max-md:px-5 md:col-span-4 md:ml-[-1.25rem] md:py-5 md:pr-5 lg:col-span-9",
        contentContainer: "p-0",
      },
      false: { textContainer: "md:col-span-6 lg:col-span-12" },
    },
    hasFallbackImage: {
      true: { image: "h-auto w-2/3 object-contain" },
      false: { image: "object-cover" },
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
}: ChildpageLayoutProps): JSX.Element => {
  const styles = createRowStyles()

  return (
    <div className={styles.container()}>
      {childpages.map(({ title, description, url, image }, idx) => {
        const renderedImage = image?.src ? image : fallback

        return (
          <Link
            href={getReferenceLinkHref(url, site.siteMap, site.assetsBaseUrl)}
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
                  className={styles.image({ hasFallbackImage: !image?.src })}
                />
              </div>
            )}
            <div
              className={styles.textContainer({
                hasThumbnail: !!showThumbnail,
              })}
            >
              <p className={styles.title()}>{title}</p>
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
  maxColumns = "3",
}: ChildrenPagesProps) => {
  const currentPageNode = getNodeFromSiteMap(site.siteMap, permalink)

  if (!currentPageNode?.children) {
    return <></>
  }

  const children = currentPageNode.children
    .map((child) => ({
      id: child.id,
      title: child.title,
      url: child.permalink,
      description: child.summary,
      image: child.image,
    }))
    .sort((a, b) => mergeChildrenPages(a, b, childrenPagesOrdering))

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
    />
  )
}
