import type { VariantProps } from "tailwind-variants"
import type { ContentpicProps as BaseContentpicProps } from "~/interfaces"
import { tv } from "~/lib/tv"

import { ImageClient } from "../../internal/ImageClient"
import { Prose } from "../../native/Prose"

const contentpicStyles = tv({
  slots: {
    // margin used for margin collapse
    container:
      "mb-7 flex flex-col gap-7 sm:flex-row [&:not(:first-child)]:mt-7",
    image: "aspect-[5/6] h-auto rounded object-cover",
    content:
      "break-words text-base-content lg:justify-self-start [&>:is(ol,ul):first-child>li:first-child]:mt-0 [&>:is(ol,ul):first-child]:mt-0",
  },
  variants: {
    order: {
      imageFirst: {
        image: "order-1",
        content: "order-2",
      },
      textFirst: {
        image: "order-2",
        content: "order-1",
      },
    },
    size: {
      default: {
        image: "sm:h-[240px] sm:w-[200px]",
        content: "flex-1",
      },
      halfHalf: {
        image: "w-full sm:w-1/2",
        content: "sm:w-1/2",
      },
    },
  },
  defaultVariants: {
    order: "imageFirst",
    size: "default",
  },
})

interface ContentpicProps
  extends
    Omit<BaseContentpicProps, "type" | "order" | "size">,
    VariantProps<typeof contentpicStyles> {}

export const Contentpic = ({
  imageSrc,
  content,
  imageAlt,
  site,
  order,
  size,
  shouldLazyLoad = true,
}: ContentpicProps): JSX.Element => {
  const styles = contentpicStyles({ order, size })

  return (
    <div className={styles.container()}>
      <ImageClient
        src={imageSrc}
        alt={imageAlt || ""}
        width="100%"
        className={styles.image()}
        assetsBaseUrl={site.assetsBaseUrl}
        lazyLoading={shouldLazyLoad}
      />

      <div className={styles.content()}>
        <Prose {...content} site={site} />
      </div>
    </div>
  )
}
