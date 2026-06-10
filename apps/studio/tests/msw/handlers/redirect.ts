import { MOCK_STORY_DATE } from "../constants"
import { trpcMsw } from "../mockTrpc"

const DEFAULT_REDIRECT_ITEMS = [
  {
    id: "1",
    source: "/old-about-us",
    destination: "/about",
    publishedAt: MOCK_STORY_DATE,
  },
  {
    id: "2",
    source: "/press-releases",
    destination: "https://www.example.gov.sg/newsroom",
    publishedAt: MOCK_STORY_DATE,
  },
]

export const redirectHandlers = {
  list: {
    default: () =>
      trpcMsw.redirect.list.query(({ input: { limit = 25, offset = 0 } }) =>
        DEFAULT_REDIRECT_ITEMS.slice(offset, offset + limit),
      ),
    empty: () => trpcMsw.redirect.list.query(() => []),
  },
  count: {
    default: () =>
      trpcMsw.redirect.count.query(() => DEFAULT_REDIRECT_ITEMS.length),
    empty: () => trpcMsw.redirect.count.query(() => 0),
  },
}
