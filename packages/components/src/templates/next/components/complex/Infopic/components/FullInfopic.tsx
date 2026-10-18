"use client"

import { InfopicVariants } from "~/interfaces/complex/Infopic"
import { useOriginalAsset } from "~/templates/next/context/OriginalAssetContext"
import { getFocalObjectPosition } from "~/utils/getFocalObjectPosition"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { resolveManagedAssetUrl } from "~/utils/resolveManagedAssetUrl"

import type { InfopicProps } from "../types"
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
  imageAdjustment,
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
  const backgroundPosition = getFocalObjectPosition(imageAdjustment) ?? "center"

  // Resolve the managed-asset URL here (a CSS background can't go through
  // ImageClient). resolveManagedAssetUrl appends original=true in the editor to
  // bypass the CDN transcode so a just-saved image shows immediately.
  const useOriginal = useOriginalAsset()
  const backgroundUrl = resolveManagedAssetUrl(
    imageSrc,
    site.assetsBaseUrl,
    useOriginal,
  )

  return (
    <section
      style={{
        backgroundImage: `url('${backgroundUrl}')`,
        backgroundSize: "cover",
        backgroundPosition,
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
