import type { VariantProps } from "tailwind-variants"

import type { ContentpicProps as BaseContentpicProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Prose } from "../../native"

const contentpicStyles = tv({
  slots: {
    container: "flex flex-col gap-7 py-7 md:flex-row",
    image: "inset-0 h-full w-full object-cover lg:absolute",
    imageContainer:
      "relative max-h-[400px] w-full md:h-[240px] md:max-h-full md:w-[200px]",
    content: "flex-1 text-base-content lg:justify-self-start",
  },
})
const compoundStyles = contentpicStyles()

interface ContentpicProps
  extends Omit<BaseContentpicProps, "type">,
    VariantProps<typeof contentpicStyles> {
  className?: string
}

export const Contentpic = ({
  imageSrc,
  content,
  imageAlt,
}: ContentpicProps): JSX.Element => {
  return (
    <div className={compoundStyles.container()}>
      <div className={compoundStyles.imageContainer()}>
        <img className={compoundStyles.image()} alt={imageAlt} src={imageSrc} />
      </div>
      <div className={compoundStyles.content()}>
        <Prose {...content} />
      </div>
    </div>
  )
}
