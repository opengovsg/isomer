import type { ButtonProps } from "react-aria-components"
import { LinkButton } from "~/components/oui-bridge/LinkButton"

interface ResendOtpButtonProps extends ButtonProps {
  timer: number
}

export const ResendOtpButton = ({
  timer,
  ...buttonProps
}: ResendOtpButtonProps): JSX.Element => {
  return (
    <LinkButton type="button" {...buttonProps}>
      Resend OTP
      {timer > 0 && <span data-chromatic="ignore">{` in ${timer}s`}</span>}
    </LinkButton>
  )
}
