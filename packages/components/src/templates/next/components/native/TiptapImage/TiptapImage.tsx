import type { TiptapImageProps } from "~/interfaces"
import { Image } from "../../complex/Image"

const TiptapImage = ({ attrs, ...rest }: TiptapImageProps) => {
  return <Image {...attrs} {...rest} />
}

export default TiptapImage
