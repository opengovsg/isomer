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
    container: "rounded-lg border-[1.5px] [&:not(:first-child)]:mt-7",
    iconWrapper: "flex shrink-0 items-center justify-center px-3 py-4",
    icon: "h-6 w-6 flex-shrink-0",
    content: "prose-headline-lg-regular min-w-0 flex-1 overflow-x-auto",
  },
  variants: {
    variant: {
      [CalloutVariant.Information.value]: {
        container:
          "border-utility-feedback-info bg-utility-feedback-info-subtle",
      },
      [CalloutVariant.GoodToKnow.value]: {
        container: "border-utility-feedback-success",
        iconWrapper: "bg-utility-feedback-success",
        icon: "text-white",
        content: "bg-utility-feedback-success-subtle",
      },
      [CalloutVariant.Warning.value]: {
        container: "border-utility-feedback-warning",
        iconWrapper: "bg-utility-feedback-warning",
        icon: "text-white",
        content: "bg-utility-feedback-warning-subtle",
      },
      [CalloutVariant.Urgent.value]: {
        container: "border-utility-feedback-alert",
        iconWrapper: "bg-utility-feedback-alert",
        icon: "text-white",
        content: "bg-utility-feedback-alert-subtle",
      },
      [CalloutVariant.Note.value]: {
        container: "border-0 bg-[#EEF0F3]",
      },
    },
    hasIcon: {
      true: {
        container: "flex items-stretch overflow-hidden",
        content: "px-5 py-4",
      },
      false: {
        container: "flex items-start gap-3 px-5 py-4",
      },
    },
  },
  defaultVariants: {
    variant: CalloutVariant.Information.value,
    hasIcon: false,
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
