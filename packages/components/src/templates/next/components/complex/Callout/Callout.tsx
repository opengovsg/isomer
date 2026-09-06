import type { IconType } from "react-icons"
import type { CalloutProps, CalloutVariant } from "~/interfaces"
import { BiCheckCircle, BiError, BiErrorCircle } from "react-icons/bi"
import { DEFAULT_CALLOUT_VARIANT } from "~/interfaces/complex/Callout"
import { tv } from "~/lib/tv"
import { handleHorizontalScrollKeyDown } from "~/utils/handleHorizontalScrollKeyDown"

import { Prose } from "../../native/Prose"

const CALLOUT_CONFIG = {
  goodToKnow: { icon: BiCheckCircle, label: "Positive update" },
  info: { label: "Information" },
  information: { label: "Information" },
  note: { label: "Note" },
  urgent: { icon: BiError, label: "Needs urgent action" },
  warning: { icon: BiErrorCircle, label: "Warning" },
} satisfies Record<CalloutVariant, { label: string; icon?: IconType }>

const calloutStyles = tv({
  defaultVariants: {
    hasIcon: false,
    variant: DEFAULT_CALLOUT_VARIANT,
  },
  slots: {
    container:
      "flex items-start gap-3 rounded-lg border-[1.5px] [&:not(:first-child)]:mt-7",
    content:
      "prose-headline-lg-regular min-w-0 flex-1 overflow-x-auto [&>:is(ol,ul):first-child>li:first-child]:mt-0 [&>:is(ol,ul):first-child]:mt-0 [&>:is(ol,ul):last-child>li:last-child]:mb-0",
    icon: "h-6 w-6 flex-shrink-0",
  },
  variants: {
    hasIcon: {
      false: { container: "px-5 py-4" },
      true: { container: "px-4 py-3" },
    },
    variant: {
      goodToKnow: {
        container:
          "border-utility-feedback-success-subtle bg-utility-feedback-success-faint",
        icon: "text-utility-feedback-success",
      },
      info: {
        container:
          "border-utility-feedback-info bg-utility-feedback-info-subtle",
      },
      information: {
        container:
          "border-utility-feedback-info bg-utility-feedback-info-subtle",
      },
      note: {
        container: "border-base-divider-medium bg-base-canvas-backdrop",
      },
      urgent: {
        container:
          "border-utility-feedback-alert-subtle bg-utility-feedback-alert-faint",
        icon: "text-utility-feedback-alert",
      },
      warning: {
        container:
          "border-utility-feedback-warning-subtle bg-utility-feedback-warning-faint",
        icon: "text-utility-feedback-warning",
      },
    },
  },
})

export const Callout = ({
  content,
  site,
  headingLevel,
  variant = DEFAULT_CALLOUT_VARIANT,
}: CalloutProps) => {
  const config = CALLOUT_CONFIG[variant]
  const {label} = config
  const Icon = "icon" in config ? config.icon : undefined
  const styles = calloutStyles({ hasIcon: !!Icon, variant })

  return (
    <fieldset className={styles.container()} aria-label={label}>
      {Icon && <Icon aria-hidden className={styles.icon()} />}
      {/* oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions -- keyboard-focusable scroll container for wide callout content */}
      <section
        className={styles.content()}
        tabIndex={0}
        aria-label={`${label} content`}
        onKeyDown={handleHorizontalScrollKeyDown}
      >
        <Prose {...content} site={site} headingLevel={headingLevel} />
      </section>
      {/* oxlint-enable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */}
    </fieldset>
  )
}
