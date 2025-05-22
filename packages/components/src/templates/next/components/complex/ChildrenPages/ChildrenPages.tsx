import type { ChildrenPagesProps, ImageClientProps } from "~/interfaces"
import type { IsomerSitemap } from "~/types"
import { tv } from "~/lib/tv"
import { ImageClient } from "~/templates/next"
import {
  getNodeFromSiteMap,
  getReferenceLinkHref,
  groupFocusVisibleHighlight,
  isExternalUrl,
} from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

const ChildpageImage = ({
  src,
  alt,
  assetsBaseUrl,
  className,
}: Pick<ImageClientProps, "className" | "assetsBaseUrl" | "src" | "alt">) => {
  const imgSrc =
    isExternalUrl(src) || assetsBaseUrl === undefined
      ? src
      : `${assetsBaseUrl}${src}`

  return (
    <ImageClient
      assetsBaseUrl={assetsBaseUrl}
      width="100%"
      className={className}
      alt={alt}
      src={imgSrc}
    />
  )
}

interface Childpage {
  title: string
  url: string
  description: string
  image?: IsomerSitemap["image"]
}

interface ChildpageLayoutProps
  extends Pick<ChildrenPagesProps, "LinkComponent" | "site"> {
  childpages: Childpage[]
  showSummary: boolean
  showThumbnail: boolean
  assetsBaseUrl?: string
  fallback: Required<NonNullable<IsomerSitemap["image"]>>
}

const createBoxStyles = tv({
  slots: {
    container: `${ComponentContent} grid grid-cols-3 gap-10 md:grid-cols-6 md:gap-x-10 [&:not(:first-child)]:mt-7`,
    imageContainer:
      "align-center col-span-full row-span-1 flex aspect-[3/2] h-full w-full justify-center border-b border-b-base-divider-subtle",
    image: "bg-white",
    textContainer:
      "col-span-full row-span-1 flex flex-col gap-2 break-words px-5 pb-5",
    contentContainer:
      "grid-rows-[1fr fit-content] group grid cursor-pointer grid-cols-subgrid content-start items-start gap-y-5 rounded-[0.25rem] border border-base-divider-medium max-md:col-span-full md:col-span-3",
    title: [
      groupFocusVisibleHighlight(),
      "prose-title-md-medium text-base-content-strong group-hover:text-brand-canvas-inverse group-hover:underline",
    ],
    description: "gray prose-body-base text-base-content",
  },
  variants: {
    layout: {
      default: {},
    },
    hasThumbnail: {
      true: {},
      false: { textContainer: "pt-5" },
    },
    hasFallbackImage: {
      true: { image: "w-[50%]" },
      false: { image: "object-cover" },
    },
  },

  defaultVariants: {
    layout: "default",
  },
})

const BoxLayout = ({
  childpages,
  showSummary,
  showThumbnail,
  assetsBaseUrl,
  fallback,
  LinkComponent,
  site,
}: ChildpageLayoutProps) => {
  const styles = createBoxStyles()

  return (
    <div className={styles.container()}>
      {childpages.map(({ title, description, url, image }, idx) => {
        const renderedImage = image?.src ? image : fallback

        return (
          <Link
            href={getReferenceLinkHref(url, site.siteMap, site.assetsBaseUrl)}
            key={`${title}-${idx}`}
            LinkComponent={LinkComponent}
            className={styles.contentContainer()}
          >
            {showThumbnail && (
              <div className={styles.imageContainer()}>
                <ChildpageImage
                  assetsBaseUrl={assetsBaseUrl}
                  {...renderedImage}
                  className={styles.image({ hasFallbackImage: !image?.src })}
                />
              </div>
            )}
            <div
              className={styles.textContainer({ hasThumbnail: showThumbnail })}
            >
              <p className={styles.title()}>{title}</p>
              {showSummary && (
                <p className={styles.description()}> {description}</p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

const createRowStyles = tv({
  slots: {
    container: `${ComponentContent} grid grid-cols-3 gap-10 md:grid-cols-6 lg:grid-cols-12 [&:not(:first-child)]:mt-7`,
    image: "bg-white",
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
      true: { image: "w-[50%]" },
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
                <ChildpageImage
                  assetsBaseUrl={assetsBaseUrl}
                  {...renderedImage}
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

const ChildrenPages = ({
  permalink,
  site,
  LinkComponent,
  variant,
  showSummary = true,
  showThumbnail,
}: ChildrenPagesProps) => {
  const currentPageNode = getNodeFromSiteMap(site.siteMap, permalink)

  if (!currentPageNode?.children) {
    return <></>
  }

  const children = currentPageNode.children.map((child) => ({
    title: child.title,
    url: child.permalink,
    description: child.summary,
    image: child.image,
  }))

  if (variant === "boxes") {
    return (
      <BoxLayout
        LinkComponent={LinkComponent}
        assetsBaseUrl={site.assetsBaseUrl}
        childpages={children}
        showSummary={showSummary}
        showThumbnail={showThumbnail}
        fallback={{ src: site.logoUrl, alt: "Default logo of the site" }}
        site={site}
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
      site={site}
    />
  )
}

export default ChildrenPages
