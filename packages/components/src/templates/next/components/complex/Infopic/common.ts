import { InfopicVariants } from "~/interfaces/complex/Infopic"
import { tv } from "~/lib/tv"

export const infopicStyles = tv({
  slots: {
    button: "mt-9",
    container:
      "grid min-h-[360px] [grid-template-areas:'img''content'] lg:grid-cols-2 lg:[grid-template-rows:auto]",
    content:
      "px-6 pb-16 pt-10 text-base-content [grid-area:content] md:max-w-[760px] md:px-10 md:pb-20 md:pt-16 lg:max-w-[620px] lg:content-center lg:py-24 lg:pl-10",
    description: "prose-body-base mt-4 break-words md:mt-6",
    image: "inset-0 h-full w-full object-cover lg:absolute",
    imageContainer: "[grid-area:img]",
    overlay: "",
    title: "prose-display-sm break-words",
  },
  variants: {
    colorScheme: {
      default: {
        container: "bg-base-canvas-backdrop",
        title: "text-base-content-strong",
      },
      inverse: {
        description: "text-base-content-inverse",
        title: "text-base-content-inverse",
      },
    },
    isTextOnRight: {
      false: {
        container: "lg:[grid-template-areas:'content_img']",
        content: "lg:w-full lg:justify-self-end lg:pr-24",
      },
      true: {
        container: "lg:[grid-template-areas:'img_content']",
        content: "lg:justify-self-start lg:pl-24",
      },
    },
    variant: {
      [InfopicVariants.Block.value]: {
        container: "[grid-template-rows:auto_1fr]",
        imageContainer:
          "relative max-h-[400px] min-h-[200px] w-full lg:max-h-full",
      },
      [InfopicVariants.Full.value]: {
        container: "[grid-template-rows:1fr_1fr]",
        overlay: "bg-base-canvas-inverse-overlay/65",
      },
    },
  },
})
