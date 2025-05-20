import type { VariantProps } from "tailwind-variants"

import type { infopicStyles } from "./common"
import type { InfopicProps as BaseInfopicProps } from "~/interfaces"

export interface InfopicProps
  extends Omit<
      BaseInfopicProps,
      "type" | "subtitle" | "sectionIndex" | "variant"
    >,
    VariantProps<typeof infopicStyles> {
  className?: string
}
