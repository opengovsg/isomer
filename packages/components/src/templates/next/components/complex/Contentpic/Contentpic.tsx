import type { VariantProps } from "tailwind-variants"

import type { ContentpicProps as BaseContentpicProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { isExternalUrl } from "~/utils"
import { Prose } from "../../native"
import { ImageClient } from "../Image"

const contentpicStyles = tv({
  slots: {
    // margin used for margin collapse
    container:
      "mb-7 flex flex-col gap-7 md:flex-row [&:not(:first-child)]:mt-7",
    image:
      "aspect-[4/5] w-full rounded object-cover md:h-[240px] md:max-h-full md:w-[200px]",
    content: "flex-1 break-words text-base-content lg:justify-self-start",
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
  LinkComponent,
  site,
}: ContentpicProps): JSX.Element => {
  const imgSrc =
    isExternalUrl(imageSrc) || site.assetsBaseUrl === undefined
      ? imageSrc
      : `${site.assetsBaseUrl}${imageSrc}`

  return (
    <div className={compoundStyles.container()}>
      <ImageClient
        src={imgSrc}
        alt={imageAlt || ""}
        width="100%"
        className={compoundStyles.image()}
        assetsBaseUrl={site.assetsBaseUrl}
      />

      <div className={compoundStyles.content()}>
        <Prose {...content} LinkComponent={LinkComponent} site={site} />
      </div>
    </div>
  )
}
