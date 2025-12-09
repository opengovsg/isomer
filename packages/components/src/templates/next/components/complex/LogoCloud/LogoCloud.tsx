import type { LogoCloudProps } from "~/interfaces/complex/LogoCloud"
import { tv } from "~/lib/tv"
import { isExternalUrl } from "~/utils"
import { ImageClient } from "../Image"

const createLogoCloudStyles = tv({
  slots: {
    container: "flex flex-col gap-6 py-16",
    title:
      "prose-headline-base-medium self-center text-center text-base-content-subtle",
    logoContainer: "flex flex-wrap justify-center gap-x-6 gap-y-2",
    logo: "inset-0 h-[90px] w-[160px] object-contain px-2",
  },
})
const compoundStyles = createLogoCloudStyles()

export const LogoCloud = ({
  images: baseImages,
  title,
  site: { assetsBaseUrl },
  shouldLazyLoad = true,
}: LogoCloudProps) => {
  const images = baseImages.map(({ src, alt }) => {
    const transformedSrc =
      isExternalUrl(src) || (assetsBaseUrl === undefined && !!src)
        ? src
        : `${assetsBaseUrl}${src}`

    return { src: transformedSrc, alt, lazyLoading: shouldLazyLoad }
  })
  return (
    <div className={compoundStyles.container()}>
      {title && <p className={compoundStyles.title()}>{title}</p>}
      <div className={compoundStyles.logoContainer()}>
        {images.map((props) => (
          <ImageClient
            {...props}
            // have to pass in here instead of w-fit because
            // flex-wrap in parent div doesn't work well with w-fit for safari
            width="auto"
            className={compoundStyles.logo()}
            assetsBaseUrl={assetsBaseUrl}
          />
        ))}
      </div>
    </div>
  )
}
