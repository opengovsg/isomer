import { tv } from "tailwind-variants"

import { InfopicVariants } from "~/interfaces/complex/Infopic"

export const infopicStyles = tv({
  slots: {
    container:
      "grid min-h-[360px] [grid-template-areas:'img''content'] [grid-template-rows:auto_1fr] lg:grid-cols-2 lg:[grid-template-rows:auto]",
    image: "inset-0 h-full w-full object-cover lg:absolute",
    imageContainer: "relative max-h-[400px] min-h-[200px] w-full lg:max-h-full",
    // max-width of content in desktop is HALF of max-w-screen-xl for correct alignment of content
    // since content is half of screen width in desktop.
    content:
      "px-6 pb-16 pt-10 text-base-content [grid-area:content] md:px-10 md:pb-20 md:pt-16 lg:content-center lg:py-24 lg:pl-10",
    title: "prose-display-md break-words",
    description: "prose-body-base mt-4 md:mt-6",
    button: "mt-9",
    overlay: "",
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
    colorScheme: {
      default: {
        container: "bg-base-canvas-backdrop",
        content: "",
        title: "text-base-content-strong",
        description: "",
      },
      inverse: {
        container: "",
        title: "text-base-content-inverse",
        description: "text-base-content-inverse",
      },
    },
    variant: {
      [InfopicVariants.Block.value]: {
        container: "",
        image: "",
        imageContainer: "[grid-area:img]",
        content: "md:max-w-[760px] lg:max-w-[620px]",
      },
      [InfopicVariants.Full.value]: {
        overlay: "bg-base-canvas-inverse-overlay/65 [grid-area:1/1/-1/-1]",
        content: "bg-brand-canvas-inverse/35 w-full bg-blend-overlay",
      },
    },
  },
})
