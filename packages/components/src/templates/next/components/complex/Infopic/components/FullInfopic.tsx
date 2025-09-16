import type { InfopicProps } from "../types"
import { InfopicVariants } from "~/interfaces/complex/Infopic"
import { getReferenceLinkHref } from "~/utils"
import { LinkButton } from "../../../internal/LinkButton"
import { infopicStyles } from "../common"

// backgroundImage cannot be lazy loaded
type FullInfopicProps = Omit<InfopicProps, "variant" | "shouldLazyLoad">

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
}: FullInfopicProps) => {
  const compoundStyles = infopicStyles({
    isTextOnRight,
    variant: InfopicVariants.Full.value,
    colorScheme: "inverse",
  })
  const hasLinkButton = !!buttonLabel && !!buttonUrl

  return (
    <section
      style={{
        backgroundImage: `url('${imageSrc}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      id={id}
    >
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
            <div className={compoundStyles.imageContainer()}></div>
          </div>
        </div>
      </div>
    </section>
  )
}
