import type { VariantProps } from "tailwind-variants"

import type { ContentpicProps as BaseContentpicProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Prose } from "../../native"

const contentpicStyles = tv({
  slots: {
    // margin used for margin collapse
    container:
      "mb-7 flex flex-col gap-7 md:flex-row [&:not(:first-child)]:mt-7",
    image:
      "max-h-[400px] w-full rounded object-cover md:h-[240px] md:max-h-full md:w-[200px]",
    content: "flex-1 text-base-content lg:justify-self-start",
  },
})
const compoundStyles = contentpicStyles()

interface ContentpicProps
  extends Omit<BaseContentpicProps, "type">,
    VariantProps<typeof contentpicStyles> {}

export const Contentpic = ({
  imageSrc,
  content,
  imageAlt,
}: ContentpicProps): JSX.Element => {
  return (
    <div className={compoundStyles.container()}>
      <img className={compoundStyles.image()} alt={imageAlt} src={imageSrc} />
      <div className={compoundStyles.content()}>
        <Prose {...content} />
      </div>
    </div>
  )
}
