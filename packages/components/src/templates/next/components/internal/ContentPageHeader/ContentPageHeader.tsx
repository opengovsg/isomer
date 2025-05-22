import type { ContentPageHeaderProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getFormattedDate, getReferenceLinkHref, isExternalUrl } from "~/utils"
import { ImageClient } from "../../complex"
import Breadcrumb from "../Breadcrumb"
import { LinkButton } from "../LinkButton"

const createContentPageHeaderStyles = tv({
  slots: {
    container: "text-base-content-strong",
    innerContainer: "mx-auto flex max-w-screen-xl flex-col gap-8",
    contentContainer: "grid-rows-[1fr fit-content] grid gap-10 lg:grid-cols-12",
    textContainer: "max-w-[54rem] flex-col px-6 md:px-10",
    textPadding: "mt-8 flex flex-col gap-5 md:mt-6",
    image:
      "row-span-1 h-full object-cover md:col-span-1 lg:col-span-5 lg:pr-10",
    lastUpdated: "prose-body-sm mt-8",
    title: "prose-display-lg break-words",
    summary: "prose-title-lg-regular mt-5",
    buttonPadding: "mt-9",
  },
  variants: {
    hasImage: {
      true: { textContainer: "pt-8 max-md:row-span-1 lg:col-span-7 lg:py-8" },
      false: { textContainer: "py-8 max-md:row-span-2 lg:col-span-12" },
    },
    colorScheme: {
      default: {
        container: "bg-brand-canvas",
        lastUpdated: "text-base-content-subtle",
      },
      inverse: {
        container: "bg-brand-canvas-inverse",
        textContainer: "text-base-content-inverse",
        lastUpdated: "text-base-content-inverse",
      },
    },
  },
  defaultVariants: {
    colorScheme: "default",
    hasImage: false,
  },
})

const ContentPageHeader = ({
  title,
  summary,
  lastUpdated,
  breadcrumb,
  buttonLabel,
  buttonUrl,
  site,
  image,
  showThumbnail,
  LinkComponent,
  colorScheme = "default",
}: ContentPageHeaderProps) => {
  const hasImage = !!image?.src
  const styles = createContentPageHeaderStyles({ colorScheme })

  return (
    <div className={styles.container()}>
      <div className={styles.innerContainer()}>
        <div className={styles.contentContainer()}>
          <div
            className={styles.textContainer({
              hasImage: showThumbnail && hasImage,
            })}
          >
            <Breadcrumb
              colorScheme={colorScheme}
              links={breadcrumb.links}
              LinkComponent={LinkComponent}
            />
            <div className="mt-8 md:mt-6">
              <h1 className={styles.title()}>{title}</h1>
              <p className={styles.summary()}>{summary}</p>
            </div>
            {buttonLabel && buttonUrl && (
              <div className={styles.buttonPadding()}>
                <LinkButton
                  href={getReferenceLinkHref(
                    buttonUrl,
                    site.siteMap,
                    site.assetsBaseUrl,
                  )}
                  LinkComponent={LinkComponent}
                  isWithFocusVisibleHighlight
                  colorScheme={colorScheme}
                >
                  {buttonLabel}
                </LinkButton>
              </div>
            )}
            <div
              className={styles.lastUpdated()}
            >{`Last updated ${getFormattedDate(lastUpdated)}`}</div>
          </div>

          {hasImage && showThumbnail && (
            <ImageClient
              assetsBaseUrl={site.assetsBaseUrl}
              alt={image.alt}
              src={
                isExternalUrl(image.src) || site.assetsBaseUrl === undefined
                  ? image.src
                  : `${site.assetsBaseUrl}${image.src}`
              }
              width="100%"
              className={styles.image()}
              lazyLoading={false}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ContentPageHeader
