import { HTMLAttributeAnchorTarget } from "react"
import { ImageProps } from "~/common"

const Image = ({ src, alt, width }: ImageProps) => (
  <img src={src} alt={alt} width={`${width ?? 100}%`} />
)

const isExternalLink = (href: string) => {
  return !href.startsWith("/")
}

const ImageComponent = ({
  src,
  alt,
  width,
  href,
  openInNewTab,
}: ImageProps) => {
  return (
    <div>
      {href ? (
        <a
          href={href}
          target={openInNewTab ? "_blank" : undefined}
          rel={
            isExternalLink(href) ? "noopener noreferrer nofollow" : undefined
          }
        >
          <Image src={src} alt={alt} width={width}></Image>
        </a>
      ) : (
        <Image src={src} alt={alt} width={width}></Image>
      )}
    </div>
  )
}

export default ImageComponent
