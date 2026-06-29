import type { ImageProps } from "~/interfaces"
import { tv } from "~/lib/tv"

import { ImageClient } from "../../internal/ImageClient"

const createImageStyles = tv({
  slots: {
    container: "mt-0 not-first:mt-7",
    caption:
      "overflow-wrap break-word prose-label-sm-medium text-base-content-subtle mt-2 max-w-[70ch] md:mx-auto md:text-center",
    image: "mx-auto h-auto max-w-full rounded-xs",
  },
  variants: {
    size: {
      smaller: {
        image: "max-w-full min-w-full md:min-w-[67%] lg:min-w-[50%]",
      },
      default: {
        image: "max-w-full min-w-full",
      },
    },
  },
})
const compoundStyles = createImageStyles()

// NOTE: This should match the smallest width possible for that size
const getSizeWidth = (size: ImageProps["size"]) => {
  switch (size) {
    case "smaller":
      return "50%"
    case "default":
    default:
      return "100%"
  }
}

export const Image = ({
  src,
  alt,
  caption,
  size,
  site,
  shouldLazyLoad = true,
}: ImageProps) => {
  return (
    <div className={compoundStyles.container()}>
      <ImageClient
        src={src}
        alt={alt}
        width={getSizeWidth(size)}
        className={compoundStyles.image({ size: size ?? "default" })}
        assetsBaseUrl={site.assetsBaseUrl}
        lazyLoading={shouldLazyLoad}
      />

      {caption && <p className={compoundStyles.caption()}>{caption}</p>}
    </div>
  )
}
