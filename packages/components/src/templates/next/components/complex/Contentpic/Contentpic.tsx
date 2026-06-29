import type { VariantProps } from "tailwind-variants"
import type { ContentpicProps as BaseContentpicProps } from "~/interfaces"
import { tv } from "~/lib/tv"

import { ImageClient } from "../../internal/ImageClient"
import { Prose } from "../../native/Prose"

const contentpicStyles = tv({
  slots: {
    // margin used for margin collapse
    container: "mb-7 flex flex-col gap-7 not-first:mt-7 sm:flex-row",
    image:
      "aspect-5/6 h-auto rounded-xs object-cover sm:h-[240px] sm:w-[200px]",
    content:
      "text-base-content flex-1 wrap-break-word lg:justify-self-start [&>:is(ol,ul):first-child]:mt-0 [&>:is(ol,ul):first-child>li:first-child]:mt-0",
  },
})
const compoundStyles = contentpicStyles()

interface ContentpicProps
  extends
    Omit<BaseContentpicProps, "type">,
    VariantProps<typeof contentpicStyles> {}

export const Contentpic = ({
  imageSrc,
  content,
  imageAlt,
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
        <Prose {...content} site={site} />
      </div>
    </div>
  )
}
