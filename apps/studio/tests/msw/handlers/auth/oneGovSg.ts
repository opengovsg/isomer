import { delay } from "msw"
import { trpcMsw } from "tests/msw/mockTrpc"

export const authOneGovSgHandlers = {
  isEnabled: (isEnabled: boolean) => {
    return trpcMsw.auth.oneGovSg.isEnabled.query(() => isEnabled)
  },
  login: {
    // Never resolves, so the story stays on the "Logging in" step instead of
    // navigating away to one.gov.sg.
    loading: () => {
      return trpcMsw.auth.oneGovSg.login.mutation(async () => {
        await delay("infinite")
        return { redirectUrl: "/", isLoggedIn: false }
      })
    },
  },
}
