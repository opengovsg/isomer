import { TRPCError } from "@trpc/server"
import { delay } from "msw"
import { trpcMsw } from "tests/msw/mockTrpc"
import { SIGN_IN_SINGPASS } from "~/lib/routes"

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
    error: () => {
      return trpcMsw.auth.oneGovSg.login.mutation(() => {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid one.gov.sg issuer",
        })
      })
    },
  },
  callback: {
    continueToSingpass: () => {
      return trpcMsw.auth.oneGovSg.callback.query(() => ({
        redirectUrl: SIGN_IN_SINGPASS,
        isLoggedIn: false,
      }))
    },
    error: () => {
      return trpcMsw.auth.oneGovSg.callback.query(() => {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid login flow",
        })
      })
    },
  },
}
