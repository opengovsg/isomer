import type { ImageProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { hasNonEmptyString } from "~/utils/truthiness"

import { ImageClient } from "../../internal/ImageClient"

const createImageStyles = tv({
  slots: {
    caption:
      "overflow-wrap break-word prose-label-sm-medium mt-2 max-w-[70ch] text-base-content-subtle md:mx-auto md:text-center",
    container: "mt-0 [&:not(:first-child)]:mt-7",
    image: "mx-auto h-auto max-w-full rounded",
  },
  variants: {
    size: {
      default: {
        image: "min-w-full max-w-full",
      },
      smaller: {
        image: "min-w-full max-w-full md:min-w-[67%] lg:min-w-[50%]",
      },
    },
  },
})
const compoundStyles = createImageStyles()

// NOTE: This should match the smallest width possible for that size
const getSizeWidth = (size: ImageProps["size"] = "default") => {
  if (size === "smaller") {
    return "50%"
  }

  return "100%"
}

export const Image = ({
  src,
  alt,
  caption,
  size,
  site,
  shouldLazyLoad = true,
}: ImageProps) => (
  <div className={compoundStyles.container()}>
    <ImageClient
      src={src}
      alt={alt}
      width={getSizeWidth(size)}
      className={compoundStyles.image({ size: size ?? "default" })}
      assetsBaseUrl={site.assetsBaseUrl}
      lazyLoading={shouldLazyLoad}
    />

    {hasNonEmptyString(caption) && (
      <p className={compoundStyles.caption()}>{caption}</p>
    )}
  </div>
)
