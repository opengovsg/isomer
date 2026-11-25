import { TRPCError } from "@trpc/server"
import { delay } from "msw"
import { trpcMsw } from "tests/msw/mockTrpc"
import { SIGN_IN_SINGPASS } from "~/lib/routes"

export const ONE_GOV_SG_AUTHORIZE_URL =
  "https://one.gov.sg/api/auth/oauth2/authorize?state=state"

export const authOneGovSgHandlers = {
  isEnabled: (isEnabled: boolean, onResolve?: () => void) => {
    return trpcMsw.auth.oneGovSg.isEnabled.query(() => {
      onResolve?.()
      return isEnabled
    })
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
    // What the server returns when one.gov.sg is not configured.
    notFound: () => {
      return trpcMsw.auth.oneGovSg.login.mutation(() => {
        throw new TRPCError({ code: "NOT_FOUND" })
      })
    },
    redirect: () => {
      return trpcMsw.auth.oneGovSg.login.mutation(() => ({
        redirectUrl: ONE_GOV_SG_AUTHORIZE_URL,
        isLoggedIn: false,
      }))
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
