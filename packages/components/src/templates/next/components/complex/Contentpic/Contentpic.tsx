import type { VariantProps } from "tailwind-variants"
import type { ContentpicProps as BaseContentpicProps } from "~/interfaces"
import { CONTENTPIC_ORIENTATION } from "~/interfaces/complex/Contentpic"
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
    size: "default",
  },
})

interface ContentpicProps
  extends
    Omit<BaseContentpicProps, "type" | "size">,
    VariantProps<typeof contentpicStyles> {}

export const Contentpic = ({
  imageSrc,
  content,
  imageAlt,
  site,
  orientation = CONTENTPIC_ORIENTATION.ImageFirst.value,
  size,
  shouldLazyLoad = true,
}: ContentpicProps): JSX.Element => {
  const styles = contentpicStyles({ size })

  const image = (
    <ImageClient
      src={imageSrc}
      alt={imageAlt || ""}
      width="100%"
      className={styles.image()}
      assetsBaseUrl={site.assetsBaseUrl}
      lazyLoading={shouldLazyLoad}
    />
  )

  const textContent = (
    <div className={styles.content()}>
      <Prose {...content} site={site} />
    </div>
  )

  const isTextFirst = orientation === CONTENTPIC_ORIENTATION.TextFirst.value

  return (
    <div className={styles.container()}>
      {isTextFirst ? (
        <>
          {textContent}
          {image}
        </>
      ) : (
        <>
          {image}
          {textContent}
        </>
      )}
    </div>
  )
}
