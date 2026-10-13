import { BiRightArrowAlt } from "react-icons/bi"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { isExternalUrl } from "~/utils/isExternalUrl"

import type { InfopicProps } from "../../next/components/complex/Infopic/types"
import { Infopic } from "../../next/components/complex/Infopic/Infopic"
import { ImageClient } from "../../next/components/internal/ImageClient"
import { Link } from "../../next/components/internal/Link"

// Recovered from d6aa299a5^ and adapted to the current Infopic contract.
// Classic is a development reference; variants it never implemented use the default.
export const ClassicInfopic = (props: InfopicProps): JSX.Element => {
  if (props.variant === "full") return <Infopic {...props} />

  const {
    id,
    title,
    description,
    imageSrc,
    imageAlt,
    buttonLabel,
    buttonUrl,
    isTextOnRight,
    shouldLazyLoad,
    site,
    headingLevel,
    className,
  } = props
  const Heading = getHeadingTag(headingLevel)
  const href = buttonUrl
    ? getReferenceLinkHref(buttonUrl, site.siteMapArray, site.assetsBaseUrl)
    : undefined

  return (
    <section id={id} className={className}>
      <div className="mx-auto grid max-w-screen-xl gap-12 px-6 py-12 md:grid-cols-2 md:gap-16 md:p-16">
        <div
          className={`flex flex-col gap-4 lg:px-8 ${isTextOnRight ? "md:order-2" : ""}`}
        >
          <Heading className="text-5xl font-semibold text-site-secondary">
            {title}
          </Heading>
          {description && (
            <p className="text-paragraph text-xl">{description}</p>
          )}
          {buttonLabel && buttonUrl && (
            <Link
              className="flex items-center gap-2 text-lg font-semibold uppercase text-site-secondary underline"
              href={href}
              isExternal={!!href && isExternalUrl(href)}
            >
              {buttonLabel}
              <BiRightArrowAlt aria-hidden className="size-5" />
            </Link>
          )}
        </div>
        <ImageClient
          src={imageSrc}
          alt={imageAlt || ""}
          width="100%"
          assetsBaseUrl={site.assetsBaseUrl}
          lazyLoading={shouldLazyLoad}
          className="aspect-square w-full rounded-lg object-cover object-center"
        />
      </div>
    </section>
  )
}
