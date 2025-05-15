import { getReferenceLinkHref } from "~/utils"
import { LinkButton } from "../../../internal/LinkButton"
import { ImageClient } from "../../Image"
import { infopicStyles } from "../common"
import { InfopicProps } from "../types"

export const BlockInfopic = ({
  id,
  imageSrc,
  title,
  buttonLabel,
  buttonUrl,
  description,
  imageAlt,
  isTextOnRight,
  site,
  LinkComponent,
  variant,
}: InfopicProps) => {
  const compoundStyles = infopicStyles({ isTextOnRight, variant })
  const hasLinkButton = !!buttonLabel && !!buttonUrl

  return (
    <section id={id} className={compoundStyles.container()}>
      <div className={compoundStyles.content()}>
        <h2 className={compoundStyles.title()}>{title}</h2>
        <p className={compoundStyles.description()}>{description}</p>
        {hasLinkButton && (
          <div className={compoundStyles.button()}>
            <LinkButton
              LinkComponent={LinkComponent}
              href={getReferenceLinkHref(
                buttonUrl,
                site.siteMap,
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
        />
      </div>
    </section>
  )
}
