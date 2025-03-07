import { trpcMsw } from "../mockTrpc"

export const whitelistHandlers = {
  isEmailWhitelisted: {
    true: () =>
      trpcMsw.whitelist.isEmailWhitelisted.query(() => {
        return true
      }),
    false: () =>
      trpcMsw.whitelist.isEmailWhitelisted.query(() => {
        return false
      }),
  },
}
