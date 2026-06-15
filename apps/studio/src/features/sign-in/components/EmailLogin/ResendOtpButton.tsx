import type { ButtonProps } from "react-aria-components"
import { cn } from "@opengovsg/oui-theme"
import { LinkButton } from "~/components/oui-bridge/LinkButton"

interface ResendOtpButtonProps extends ButtonProps {
  timer: number
}

export const ResendOtpButton = ({
  timer,
  className,
  ...buttonProps
}: ResendOtpButtonProps): JSX.Element => {
  return (
    <LinkButton
      type="button"
      className={cn("prose-subhead-2 whitespace-pre-wrap gap-0", className)}
      {...buttonProps}
    >
      Resend OTP
      {timer > 0 && <span data-chromatic="ignore">{` in ${timer}s`}</span>}
    </LinkButton>
  )
}
