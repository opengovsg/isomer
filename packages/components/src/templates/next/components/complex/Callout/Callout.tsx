import type { IconType } from "react-icons"
import type { CalloutProps } from "~/interfaces"
import { BiCheckCircle, BiError, BiErrorCircle } from "react-icons/bi"
import { CalloutVariant } from "~/interfaces"
import { tv } from "~/lib/tv"

import { Prose } from "../../native/Prose"

const CALLOUT_ICONS: Partial<
  Record<NonNullable<CalloutProps["variant"]>, IconType>
> = {
  [CalloutVariant.GoodToKnow.value]: BiCheckCircle,
  [CalloutVariant.Warning.value]: BiErrorCircle,
  [CalloutVariant.Urgent.value]: BiError,
}

const CALLOUT_LABELS: Partial<
  Record<NonNullable<CalloutProps["variant"]>, string>
> = {
  [CalloutVariant.Information.value]: CalloutVariant.Information.label,
  [CalloutVariant.GoodToKnow.value]: CalloutVariant.GoodToKnow.label,
  [CalloutVariant.Warning.value]: CalloutVariant.Warning.label,
  [CalloutVariant.Urgent.value]: CalloutVariant.Urgent.label,
  [CalloutVariant.Note.value]: CalloutVariant.Note.label,
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
      [CalloutVariant.Information.value]: {
        container:
          "border-utility-feedback-info bg-utility-feedback-info-subtle",
      },
      [CalloutVariant.GoodToKnow.value]: {
        container: "border-[#009D47] bg-[#DCEAE2]",
        icon: "text-[#009D47]",
      },
      [CalloutVariant.Warning.value]: {
        container: "border-[#FAC515] bg-[#FEF7C3]",
        icon: "text-[#FAC515]",
      },
      [CalloutVariant.Urgent.value]: {
        container: "border-[#D90000] bg-[#FCF1F1]",
        icon: "text-[#D90000]",
      },
      [CalloutVariant.Note.value]: {
        container: "border-0 bg-[#EEF0F3]",
      },
    },
  },
  defaultVariants: {
    variant: CalloutVariant.Information.value,
  },
})

export const Callout = ({ content, site, variant }: CalloutProps) => {
  const Icon = variant ? CALLOUT_ICONS[variant] : undefined
  const styles = calloutStyles({ variant, hasIcon: !!Icon })
  const label = variant ? CALLOUT_LABELS[variant] : undefined

  return (
    <div className={styles.container()} role="group" aria-label={label}>
      {Icon && (
        <div className={styles.iconWrapper()}>
          <Icon aria-hidden className={styles.icon()} />
        </div>
      )}
      <div className={styles.content()} tabIndex={0}>
        <Prose {...content} site={site} />
      </div>
    </div>
  )
}
