import type { IconType } from "react-icons"
import type { CalloutProps, CalloutVariant } from "~/interfaces"
import { BiCheckCircle, BiError, BiErrorCircle } from "react-icons/bi"
import { DEFAULT_CALLOUT_VARIANT } from "~/interfaces/complex/Callout"
import { tv } from "~/lib/tv"

import {
  contentBlockIndexAttr,
  type ContentBlockIndexProps,
} from "../../../render/contentBlockIndex"
import { Prose } from "../../native/Prose"

const CALLOUT_CONFIG: Record<
  CalloutVariant,
  { label: string; icon?: IconType }
> = {
  info: { label: "Information" },
  information: { label: "Information" },
  goodToKnow: { label: "Positive update", icon: BiCheckCircle },
  warning: { label: "Warning", icon: BiErrorCircle },
  urgent: { label: "Needs urgent action", icon: BiError },
  note: { label: "Note" },
}

const calloutStyles = tv({
  slots: {
    container:
      "flex items-start gap-3 rounded-lg border-[1.5px] [&:not(:first-child)]:mt-7",
    icon: "h-6 w-6 flex-shrink-0",
    content:
      "prose-headline-lg-regular min-w-0 flex-1 overflow-x-auto [&>:is(ol,ul):first-child>li:first-child]:mt-0 [&>:is(ol,ul):first-child]:mt-0 [&>:is(ol,ul):last-child>li:last-child]:mb-0",
  },
  variants: {
    variant: {
      info: {
        container:
          "border-utility-feedback-info bg-utility-feedback-info-subtle",
      },
      information: {
        container:
          "border-utility-feedback-info bg-utility-feedback-info-subtle",
      },
      goodToKnow: {
        container:
          "border-utility-feedback-success-subtle bg-utility-feedback-success-faint",
        icon: "text-utility-feedback-success",
      },
      warning: {
        container:
          "border-utility-feedback-warning-subtle bg-utility-feedback-warning-faint",
        icon: "text-utility-feedback-warning",
      },
      urgent: {
        container:
          "border-utility-feedback-alert-subtle bg-utility-feedback-alert-faint",
        icon: "text-utility-feedback-alert",
      },
      note: {
        container: "border-base-divider-medium bg-base-canvas-backdrop",
      },
    },
    hasIcon: {
      true: { container: "px-4 py-3" },
      false: { container: "px-5 py-4" },
    },
  },
  defaultVariants: {
    variant: DEFAULT_CALLOUT_VARIANT,
    hasIcon: false,
  },
})

type CalloutRenderProps = CalloutProps & ContentBlockIndexProps

export const Callout = ({
  content,
  site,
  headingLevel,
  variant = DEFAULT_CALLOUT_VARIANT,
  contentBlockIndex,
}: CalloutRenderProps) => {
  const { icon: Icon, label } = CALLOUT_CONFIG[variant]
  const styles = calloutStyles({ variant, hasIcon: !!Icon })

  return (
    <div
      className={styles.container()}
      role="group"
      aria-label={label}
      {...contentBlockIndexAttr(contentBlockIndex)}
    >
      {Icon && <Icon aria-hidden className={styles.icon()} />}
      <div className={styles.content()} tabIndex={0}>
        <Prose {...content} site={site} headingLevel={headingLevel} />
      </div>
    </div>
  )
}
