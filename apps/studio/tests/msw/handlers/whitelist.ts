import { trpcMsw } from "../mockTrpc"

export const whitelistHandlers = {
  isEmailWhitelisted: {
    false: () =>
      trpcMsw.whitelist.isEmailWhitelisted.query(() => {
        return false
      }),
    true: () =>
      trpcMsw.whitelist.isEmailWhitelisted.query(() => {
        return true
      }),
  },
}
