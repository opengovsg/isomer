import type { VariantProps } from "tailwind-variants"

import type { ContentpicProps as BaseContentpicProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Prose } from "../../native/Prose"
import { ImageClient } from "../../internal/ImageClient"

const contentpicStyles = tv({
  slots: {
    // margin used for margin collapse
    container:
      "mb-7 flex flex-col gap-7 sm:flex-row [&:not(:first-child)]:mt-7",
    image: "aspect-[5/6] h-auto rounded object-cover sm:h-[240px] sm:w-[200px]",
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
  shouldLazyLoad = true,
}: ContentpicProps): JSX.Element => {
  return (
    <div className={compoundStyles.container()}>
      <ImageClient
        src={imageSrc}
        alt={imageAlt || ""}
        width="100%"
        className={compoundStyles.image()}
        assetsBaseUrl={site.assetsBaseUrl}
        lazyLoading={shouldLazyLoad}
      />

      <div className={compoundStyles.content()}>
        <Prose {...content} LinkComponent={LinkComponent} site={site} />
      </div>
    </div>
  )
}
