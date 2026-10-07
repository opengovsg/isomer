import { InfopicVariants } from "~/interfaces/complex/Infopic"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import type { InfopicProps } from "../types"
import { ImageClient } from "../../../internal/ImageClient"
import { LinkButton } from "../../../internal/LinkButton"
import { infopicStyles } from "../common"

type FullInfopicProps = Omit<InfopicProps, "variant" | "shouldLazyLoad">

export const FullInfopic = ({
  id,
  imageSrc,
  imageAlt,
  title,
  buttonLabel,
  buttonUrl,
  description,
  isTextOnRight,
  site,
  headingLevel,
}: FullInfopicProps) => {
  const Tag = getHeadingTag(headingLevel)
  const compoundStyles = infopicStyles({
    isTextOnRight,
    variant: InfopicVariants.Full.value,
    colorScheme: "inverse",
  })
  const hasLinkButton = !!buttonLabel && !!buttonUrl

  return (
    <section id={id} className={compoundStyles.section()}>
      {/* CSS background-image ignores EXIF orientation, so phone photos
          render rotated or flipped. An img lets the browser apply the tag. */}
      <ImageClient
        src={imageSrc}
        alt={imageAlt || ""}
        width="100%"
        className={compoundStyles.background()}
        assetsBaseUrl={site.assetsBaseUrl}
        lazyLoading={false}
      />
      <div className={compoundStyles.overlay()}>
        <div
          // NOTE: This cannot be a tailwind css className
          // as we are dynamically setting it at runtime and tailwind
          // won't pickup on the color at build time.
          style={{
            backgroundColor: `color-mix(
                              in srgb,
                              var(--color-brand-canvas-inverse) 65%,
                              transparent
                            )`,
          }}
        >
          <div className={compoundStyles.container()}>
            <div className={compoundStyles.content()}>
              <Tag className={compoundStyles.title()}>{title}</Tag>
              <p className={compoundStyles.description()}>{description}</p>
              {hasLinkButton && (
                <div className={compoundStyles.button()}>
                  <LinkButton
                    href={getReferenceLinkHref(
                      buttonUrl,
                      site.siteMapArray,
                      site.assetsBaseUrl,
                    )}
                    isWithFocusVisibleHighlight
                    colorScheme="inverse"
                  >
                    {buttonLabel}
                  </LinkButton>
                </div>
              )}
            </div>
            <div className={compoundStyles.imageContainer()}></div>
          </div>
        </div>
      </div>
    </section>
  )
}
