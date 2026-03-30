import type { VariantProps } from "tailwind-variants"
import type { InfopicProps as BaseInfopicProps } from "~/interfaces"

import type { infopicStyles } from "./common"

export interface InfopicProps
  extends
    Omit<BaseInfopicProps, "type" | "subtitle" | "sectionIndex" | "variant">,
    VariantProps<typeof infopicStyles> {
  className?: string
}
