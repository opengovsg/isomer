import type { PropsWithChildren } from "react"

import type { ImageProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { isExternalUrl } from "~/utils"
import { Link } from "../../internal/Link"

const createImageStyles = tv({
  slots: {
    container: "mt-0 [&:not(:first-child)]:mt-7",
    caption:
      "overflow-wrap break-word prose-label-sm-medium mt-2 max-w-[100ch] text-base-content-subtle lg:mx-auto lg:text-center",
    image: "mx-auto h-auto max-w-full rounded",
  },
  variants: {
    size: {
      smaller: {
        image: "min-w-full max-w-full md:min-w-[67%] lg:min-w-[50%]",
      },
      default: {
        image: "min-w-full max-w-full",
      },
    },
  },
})
const compoundStyles = createImageStyles()

const ImageContainer = ({
  href,
  LinkComponent,
  children,
}: PropsWithChildren<Pick<ImageProps, "href" | "LinkComponent">>) => (
  <div className={compoundStyles.container()}>
    {href !== undefined ? (
      <Link
        href={href}
        target={isExternalUrl(href) ? "_blank" : undefined}
        rel={isExternalUrl(href) ? "noopener noreferrer nofollow" : undefined}
        LinkComponent={LinkComponent}
      >
        {children}
      </Link>
    ) : (
      <>{children}</>
    )}
  </div>
)

const Image = ({
  src,
  alt,
  caption,
  size,
  href,
  assetsBaseUrl,
  LinkComponent,
}: ImageProps) => {
  const imgSrc =
    isExternalUrl(src) || assetsBaseUrl === undefined
      ? src
      : `${assetsBaseUrl}${src}`

  return (
    <ImageContainer href={href} LinkComponent={LinkComponent}>
      <img
        src={imgSrc}
        alt={alt}
        height="auto"
        className={compoundStyles.image({ size: size ?? "default" })}
        onError={({ currentTarget }) => {
          currentTarget.onerror = null
          currentTarget.src = `${assetsBaseUrl}/placeholder_no_image.png`
        }}
      />

      {caption && <p className={compoundStyles.caption()}>{caption}</p>}
    </ImageContainer>
  )
}

export default Image
