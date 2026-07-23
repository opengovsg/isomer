import type { IconType } from "react-icons"
import type { CalloutProps, CalloutVariant } from "~/interfaces"
import { BiCheckCircle, BiError, BiErrorCircle } from "react-icons/bi"
import { DEFAULT_CALLOUT_VARIANT } from "~/interfaces/complex/Callout"
import { tv } from "~/lib/tv"

import { Prose } from "../../native/Prose"

const CALLOUT_CONFIG: Record<
  CalloutVariant,
  { label: string; icon?: IconType }
> = {
  information: { label: "Information" },
  goodToKnow: { label: "Positive update", icon: BiCheckCircle },
  warning: { label: "Warning", icon: BiErrorCircle },
  urgent: { label: "Needs urgent action", icon: BiError },
  note: { label: "Note" },
}

const calloutStyles = tv({
  slots: {
    container: "rounded-lg border-[1.5px] [&:not(:first-child)]:mt-7",
    iconWrapper: "flex shrink-0 items-center justify-center px-3 py-4",
    icon: "h-6 w-6 flex-shrink-0",
    content:
      "prose-headline-lg-regular min-w-0 flex-1 overflow-x-auto [&>:is(ol,ul):first-child>li:first-child]:mt-0 [&>:is(ol,ul):first-child]:mt-0 [&>:is(ol,ul):last-child>li:last-child]:mb-0",
  },
  variants: {
    variant: {
      information: {
        container:
          "border-utility-feedback-info bg-utility-feedback-info-subtle",
      },
      goodToKnow: {
        container: "border-utility-feedback-success",
        iconWrapper: "bg-utility-feedback-success",
        icon: "text-white",
        content: "bg-utility-feedback-success-subtle",
      },
      warning: {
        container: "border-utility-feedback-warning",
        iconWrapper: "bg-utility-feedback-warning",
        icon: "text-white",
        content: "bg-utility-feedback-warning-subtle",
      },
      urgent: {
        container: "border-utility-feedback-alert",
        iconWrapper: "bg-utility-feedback-alert",
        icon: "text-white",
        content: "bg-utility-feedback-alert-subtle",
      },
      note: {
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
    variant: DEFAULT_CALLOUT_VARIANT,
    hasIcon: false,
  },
})

export const Callout = ({
  content,
  site,
  variant = DEFAULT_CALLOUT_VARIANT,
}: CalloutProps) => {
  const { icon: Icon, label } = CALLOUT_CONFIG[variant]
  const styles = calloutStyles({ variant, hasIcon: !!Icon })

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
