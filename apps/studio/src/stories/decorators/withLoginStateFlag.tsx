import type { Decorator } from "@storybook/nextjs-vite"
import { useLoginState } from "~/features/auth"

export const LOGIN_STATE_FLAG_TEST_ID = "login-state-flag"

const LoginStateFlag = (): JSX.Element => {
  const { hasLoginStateFlag } = useLoginState()
  return (
    <span data-testid={LOGIN_STATE_FLAG_TEST_ID} hidden>
      {String(hasLoginStateFlag)}
    </span>
  )
}

/** Exposes the localStorage login flag so play functions can assert on it. */
export const withLoginStateFlag: Decorator = (Story) => (
  <>
    <Story />
    <LoginStateFlag />
  </>
)
