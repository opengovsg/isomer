import { HTMLAttributeAnchorTarget } from "react"
import { ImageProps } from "~/common"

const Image = ({ src, alt, width }: ImageProps) => (
  <img src={src} alt={alt} width={`${width ?? 100}%`} />
)


const ImageComponent = ({ src, alt, width, href }: ImageProps) => {
  return (
    <div>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={
            href.startsWith("http") ? "noopener noreferrer nofollow" : undefined
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
