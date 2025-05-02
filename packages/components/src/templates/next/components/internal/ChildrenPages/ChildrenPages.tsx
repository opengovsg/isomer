import type { ChildrenPagesProps } from "~/interfaces"
import { CARDS_WITHOUT_IMAGES } from "~/interfaces/complex/InfoCards"
import { tv } from "~/lib/tv"
import { IsomerSitemap } from "~/types"
import {
  getNodeFromSiteMap,
  groupFocusVisibleHighlight,
  isExternalUrl,
} from "~/utils"
import { ImageClient, ImageClientProps, InfoCards } from "../../complex"
import { ComponentContent } from "../customCssClass"

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

interface RowLayoutProps extends Pick<ChildrenPagesProps, "LinkComponent"> {
  childpages: Childpage[]
  showSummary: boolean
  showThumbnail: boolean
  assetsBaseUrl?: string
  fallback: Required<NonNullable<IsomerSitemap["image"]>>
}

const createRowStyles = tv({
  slots: {
    container: `${ComponentContent} grid grid-cols-3 gap-10 md:grid-cols-6 lg:grid-cols-12`,
    image:
      "aspect-[3/2] object-cover max-md:col-span-full max-md:row-span-1 md:col-span-2 lg:col-span-3",
    textContainer: "max-md:col-span-full max-md:row-span-1",
    contentContainer:
      // NOTE: Our `rounded-sm` compiles down to `0.125 rem` rather than `0.25 rem`, necessitating this
      "max-md:grid-rows-[1fr fit-content] group grid grid-cols-subgrid rounded-[0.25rem] border border-base-divider-medium p-5 max-md:col-span-full max-md:gap-y-5 md:col-span-6 lg:col-span-12",
    title: [
      groupFocusVisibleHighlight(),
      "prose-title-md-medium text-base-content-strong group-hover:text-brand-canvas-inverse group-hover:underline",
    ],
    description: "gray prose-body-base text-gray-700",
  },
  variants: {
    layout: {
      default: {},
    },
    hasThumbnail: {
      true: {
        textContainer:
          "pb-5 max-md:px-5 md:col-span-4 md:py-5 md:pr-5 lg:col-span-9",
        contentContainer: "p-0",
      },
      false: { textContainer: "md:col-span-6 lg:col-span-12" },
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
}: RowLayoutProps): JSX.Element => {
  const styles = createRowStyles()

  return (
    <div className={styles.container()}>
      {childpages.map(({ title, description, url, image }) => {
        const renderedImage = image?.src ? image : fallback

        return (
          <div
            className={styles.contentContainer({
              hasThumbnail: !!showThumbnail,
            })}
          >
            {showThumbnail && (
              <ChildpageImage
                assetsBaseUrl={assetsBaseUrl}
                {...renderedImage}
                className={styles.image()}
              />
            )}
            <div
              className={styles.textContainer({
                hasThumbnail: !!showThumbnail,
              })}
            >
              <LinkComponent href={url} className={styles.title()}>
                {title}
              </LinkComponent>
              {showSummary && (
                <p className={styles.description()}>{description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const ChildrenPages = ({
  permalink,
  site,
  LinkComponent,
  layout,
  showSummary,
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

  if (layout === "rows") {
    return (
      <RowLayout
        LinkComponent={LinkComponent}
        assetsBaseUrl={site.assetsBaseUrl}
        childpages={children}
        showSummary={showSummary}
        showThumbnail={showThumbnail}
        fallback={{ src: site.logoUrl, alt: "Default logo of the site" }}
      />
    )
  }

  return (
    <InfoCards
      type="infocards"
      // NOTE: We are bypassing the validation here as we are reusing the
      // InfoCards component but we do not need a title here
      title=""
      variant={CARDS_WITHOUT_IMAGES}
      cards={children}
      maxColumns="1"
      layout={"index"}
      site={site}
      LinkComponent={LinkComponent}
    />
  )
}

export default ChildrenPages
