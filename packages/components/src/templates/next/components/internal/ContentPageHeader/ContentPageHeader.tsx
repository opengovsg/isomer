import type { ContentPageHeaderProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { getFormattedDate } from "~/utils/getFormattedDate"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { hasNonEmptyString } from "~/utils/truthiness"

import { Breadcrumb } from "../Breadcrumb"
import { ImageClient } from "../ImageClient"
import { LinkButton } from "../LinkButton"

const createContentPageHeaderStyles = tv({
  defaultVariants: {
    colorScheme: "default",
    hasImage: false,
  },
  slots: {
    buttonPadding: "mt-9",
    container: "text-base-content-strong",
    contentContainer: "grid-rows-[1fr fit-content] grid gap-10 lg:grid-cols-12",
    image:
      "row-span-1 h-full object-cover md:col-span-1 lg:col-span-5 lg:pr-10",
    innerContainer: "mx-auto flex max-w-screen-xl flex-col gap-8",
    lastUpdated: "prose-body-sm mt-8",
    summary: "prose-title-lg-regular mt-5",
    textContainer: "max-w-[54rem] flex-col px-6 md:px-10",
    textPadding: "mt-8 flex flex-col gap-5 md:mt-6",
    title: "prose-display-lg break-words",
  },
  variants: {
    colorScheme: {
      default: {
        container: "bg-brand-canvas",
        lastUpdated: "text-base-content-subtle",
      },
      inverse: {
        container: "bg-brand-canvas-inverse",
        lastUpdated: "text-base-content-inverse",
        textContainer: "text-base-content-inverse",
      },
    },
    hasImage: {
      false: { textContainer: "py-8 max-md:row-span-2 lg:col-span-12" },
      true: { textContainer: "pt-8 max-md:row-span-1 lg:col-span-7 lg:py-8" },
    },
  },
})

export const ContentPageHeader = ({
  title,
  summary,
  lastUpdated,
  breadcrumb,
  buttonLabel,
  buttonUrl,
  site,
  image,
  showThumbnail,
  colorScheme = "default",
}: ContentPageHeaderProps) => {
  const hasImage = hasNonEmptyString(image?.src)
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
            <Breadcrumb colorScheme={colorScheme} links={breadcrumb.links} />
            <div className="mt-8 md:mt-6">
              <h1 className={styles.title()}>{title}</h1>
              <p className={styles.summary()}>{summary}</p>
            </div>
            {hasNonEmptyString(buttonLabel) && hasNonEmptyString(buttonUrl) && (
              <div className={styles.buttonPadding()}>
                <LinkButton
                  href={getReferenceLinkHref(
                    buttonUrl,
                    site.siteMapArray,
                    site.assetsBaseUrl,
                  )}
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
