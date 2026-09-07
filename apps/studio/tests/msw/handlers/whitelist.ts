import { trpcMsw } from "../mockTrpc"

export const whitelistHandlers = {
  isEmailWhitelisted: {
    false: () => trpcMsw.whitelist.isEmailWhitelisted.query(() => false),
    true: () => trpcMsw.whitelist.isEmailWhitelisted.query(() => true),
  },
}
