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
      small: {
        image: "min-w-full xs:min-w-[67%] md:min-w-[33%] lg:min-w-0",
      },
      medium: {
        image: "min-w-full xs:min-w-[33%] md:min-w-0",
      },
      large: { image: "min-w-0" },
    },
  },
})
const compoundStyles = createImageStyles()

// Enforce a certain minimum width of image if screen size is small
const getWidthSize = (width: ImageProps["width"]) => {
  if (width === undefined || width >= 66) {
    return "large"
  } else if (width >= 40) {
    return "medium"
  } else {
    return "small"
  }
}

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
  width,
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
        width={`${width ?? 100}%`}
        height="auto"
        className={compoundStyles.image({ size: getWidthSize(width) })}
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
