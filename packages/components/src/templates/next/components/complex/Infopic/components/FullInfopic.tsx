import { getReferenceLinkHref } from "~/utils"
import { LinkButton } from "../../../internal/LinkButton"
import { ImageClient } from "../../Image"
import { infopicStyles } from "../common"
import { InfopicProps } from "../types"

export const FullInfopic = ({
  id,
  imageSrc,
  title,
  buttonLabel,
  buttonUrl,
  description,
  isTextOnRight,
  site,
  LinkComponent,
  variant,
}: InfopicProps) => {
  const compoundStyles = infopicStyles({
    isTextOnRight,
    variant,
    colorScheme: "inverse",
  })
  const hasLinkButton = !!buttonLabel && !!buttonUrl

  return (
    <section
      id={id}
      className={compoundStyles.container()}
      style={{
        backgroundImage: `url('${imageSrc}')`,
      }}
    >
      {/* set the outer opacity here */}
      <div className={compoundStyles.overlay()}>
        {/* tint here */}
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
                colorScheme="inverse"
              >
                {buttonLabel}
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
