import { HTMLAttributeAnchorTarget } from "react"

export interface ImageProps {
  src?: string
  alt?: string
  width?: number
  href?: string
  openInNewTab?: boolean
}

const Image = ({ src, alt, width }: ImageProps) => (
  <img src={src} alt={alt} width={`${width ?? 100}%`} />
)

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
        <a href={href} target={openInNewTab ? "_blank" : undefined}>
          <Image src={src} alt={alt} width={width}></Image>
        </a>
      ) : (
        <Image src={src} alt={alt} width={width}></Image>
      )}
    </div>
  )
}

export default ImageComponent
