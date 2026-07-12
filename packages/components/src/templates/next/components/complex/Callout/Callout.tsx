import type { IconType } from "react-icons"
import type { CalloutProps } from "~/interfaces"
import { BiCheckCircle, BiError, BiErrorCircle } from "react-icons/bi"
import { CalloutVariant } from "~/interfaces"
import { tv } from "~/lib/tv"

import { Prose } from "../../native/Prose"

const CALLOUT_ICONS: Partial<
  Record<NonNullable<CalloutProps["variant"]>, IconType>
> = {
  [CalloutVariant.GoodNews.value]: BiCheckCircle,
  [CalloutVariant.Note.value]: BiErrorCircle,
  [CalloutVariant.ActionNeeded.value]: BiError,
}

const calloutStyles = tv({
  slots: {
    container:
      "flex items-start gap-3 rounded-lg border-[1.5px] px-5 py-4 [&:not(:first-child)]:mt-7",
    content: "prose-headline-lg-regular",
    icon: "h-6 w-6 flex-shrink-0",
  },
  variants: {
    variant: {
      [CalloutVariant.Important.value]: {
        container:
          "border-utility-feedback-info bg-utility-feedback-info-subtle",
      },
      [CalloutVariant.GoodNews.value]: {
        container: "border-[#009D47] bg-[#DCEAE2]",
        icon: "text-[#009D47]",
      },
      [CalloutVariant.Note.value]: {
        container: "border-[#FAC515] bg-[#FEF7C3]",
        icon: "text-[#FAC515]",
      },
      [CalloutVariant.ActionNeeded.value]: {
        container: "border-[#D90000] bg-[#FCF1F1]",
        icon: "text-[#D90000]",
      },
      [CalloutVariant.AdditionalInformation.value]: {
        container: "border-0 bg-[#EEF0F3]",
      },
    },
  },
  defaultVariants: {
    variant: CalloutVariant.Important.value,
  },
})

export const Callout = ({ content, site, variant }: CalloutProps) => {
  const styles = calloutStyles({ variant })
  const Icon = variant ? CALLOUT_ICONS[variant] : undefined

  return (
    <div className={styles.container()}>
      {Icon && <Icon aria-hidden className={styles.icon()} />}
      <div className={styles.content()}>
        <Prose {...content} site={site} />
      </div>
    </div>
  )
}
