import { IsomerSiteProps } from "~/types"
import { isExternalUrl } from "~/utils"
import { ImageClient } from "../Image"

interface Image {
  src?: string
  alt: string
}
interface LogoCloudProps extends Pick<IsomerSiteProps, "assetsBaseUrl"> {
  images: Image[]
  title?: string
}
export const LogoCloud = ({
  images: baseImages,
  title,
  assetsBaseUrl,
}: LogoCloudProps) => {
  const images = baseImages.map(({ src, alt }) => {
    const transformedSrc =
      isExternalUrl(src) || (assetsBaseUrl === undefined && !!src)
        ? src
        : `${assetsBaseUrl}${baseImages}`

    return { src: transformedSrc, alt }
  })
  return (
    <div className="px-10 py-12">
      <div className="flex flex-col gap-4">
        <p className="prose-headline-base-medium self-center text-base-content-light">
          {title ?? "With support from these agencies"}
        </p>
        <div className="flex flex-wrap justify-center">
          {images.map((props) => (
            <ImageClient
              {...props}
              width="100%"
              className="inset-0 w-fit max-w-52 object-contain p-2"
              assetsBaseUrl={assetsBaseUrl}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
