import type { VariantProps } from "tailwind-variants"

import type { InfopicProps as BaseInfopicProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { LinkButton } from "../../internal/LinkButton"

const infopicStyles = tv({
  slots: {
    container:
      "grid min-h-[360px] bg-base-canvas-backdrop [grid-template-areas:'img''content'] [grid-template-rows:auto_1fr] lg:grid-cols-2",
    image: "inset-0 h-full w-full object-cover lg:absolute",
    imageContainer:
      "relative max-h-[400px] w-full [grid-area:img] md:max-h-[560px] lg:max-h-full",
    // max-width of content in desktop is HALF of max-w-screen-xl for correct alignment of content
    // since content is half of screen width in desktop.
    content:
      "px-6 pb-16 pt-10 text-base-content [grid-area:content] md:max-w-[760px] md:px-10 md:pb-20 md:pt-16 lg:max-w-[620px] lg:py-24 lg:pl-10",
    title: "prose-display-md text-base-content-strong",
    description: "prose-body-base mt-6",
    button: "mt-9",
  },
  variants: {
    isTextOnRight: {
      true: {
        container: "lg:[grid-template-areas:'img_content']",
        content: "lg:justify-self-start lg:pl-24",
      },
      false: {
        container: "lg:[grid-template-areas:'content_img']",
        content: "lg:justify-self-end lg:pr-24",
      },
    },
  },
})

interface InfopicProps
  extends Omit<BaseInfopicProps, "type" | "subtitle" | "sectionIndex">,
    VariantProps<typeof infopicStyles> {
  className?: string
}

export const Infopic = ({
  imageSrc,
  title,
  buttonLabel,
  buttonUrl,
  description,
  imageAlt,
  isTextOnRight,
  LinkComponent,
}: InfopicProps): JSX.Element => {
  const compoundStyles = infopicStyles({ isTextOnRight })
  const hasLinkButton = buttonLabel && buttonUrl

  return (
    <div className={compoundStyles.container()}>
      <div className={compoundStyles.content()}>
        <h3 className={compoundStyles.title()}>{title}</h3>
        <p className={compoundStyles.description()}>{description}</p>
        {hasLinkButton && (
          <div className={compoundStyles.button()}>
            <LinkButton LinkComponent={LinkComponent} href={buttonUrl}>
              {buttonLabel}
            </LinkButton>
          </div>
        )}
      </div>
      <div className={compoundStyles.imageContainer()}>
        <img className={compoundStyles.image()} alt={imageAlt} src={imageSrc} />
      </div>
    </div>
  )
}
