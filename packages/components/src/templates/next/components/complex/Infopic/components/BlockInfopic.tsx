import { InfopicVariants } from "~/interfaces/complex/Infopic"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import type { InfopicProps } from "../types"
import { ImageClient } from "../../../internal/ImageClient"
import { LinkButton } from "../../../internal/LinkButton"
import { infopicStyles } from "../common"

export const BlockInfopic = ({
  id,
  imageSrc,
  title,
  buttonLabel,
  buttonUrl,
  description,
  imageAlt,
  isTextOnRight,
  shouldLazyLoad,
  site,
  headingLevel,
}: Omit<InfopicProps, "variant">) => {
  const Tag = getHeadingTag(headingLevel)
  const compoundStyles = infopicStyles({
    isTextOnRight,
    variant: InfopicVariants.Block.value,
    colorScheme: "default",
  })
  const hasLinkButton = !!buttonLabel && !!buttonUrl

  return (
    <section id={id} className={compoundStyles.container()}>
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
            >
              {buttonLabel}
            </LinkButton>
          </div>
        )}
      </div>
      <div className={compoundStyles.imageContainer()}>
        <ImageClient
          src={imageSrc}
          alt={imageAlt || ""}
          width="100%"
          className={compoundStyles.image()}
          assetsBaseUrl={site.assetsBaseUrl}
          lazyLoading={shouldLazyLoad}
        />
      </div>
    </section>
  )
}
